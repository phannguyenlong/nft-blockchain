const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const path = require("path");
const { chdir, cwd } = require('process');
const {PeerOrganization} = require('../application/channel-utils/Organizations');
const {OrdererOrganization} = require('../application/channel-utils/Organizations');

let NETWORK_PATH = __dirname + "/../leopard-network/"
let UTIL_PATH = __dirname


async function createConfigtx(peer) {
    companyname = peer.getNormalizeOrg; // normalize data

    let jsonConfig = { 
        Organizations:
        [{
            Name: companyname, 
            ID: `${companyname}.msp`,
            // rememeber to change when change dir     
            MSPDir: `${NETWORK_PATH}organizations/${peer.getNormalizeChannel}/peerOrganizations/${companyname}/msp`, 
            Policies:
            {
                Readers: 
                {
                    Type: 'Signature',
                    Rule: "OR('Org3MSP.admin', 'Org3MSP.peer')",
                },
                Writers: 
                {
                    Type: 'Signature',
                    Rule: "OR('Org3MSP.admin')",
                },
                Admins: 
                {
                    Type: 'Signature',
                    Rule: "OR('Org3MSP.admin')",
                },
                Endorsement: 
                {
                    Type: 'Signature',
                    Rule: "OR('Org3MSP.peer')",
                }
            
            }
        }]
    }

    // wrtie to file
    let filePath = NETWORK_PATH + `channel-artifacts/${peer.getNormalizeChannel}`
    if (!fs.existsSync(filePath)) { // if not create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/configtx.yaml`, yaml.dump(jsonConfig, { lineWidth: -1 }))
    console.log('yaml creation sucess');

    shell.env["PATH"] = __dirname + "/../../bin/:" + shell.env["PATH"] 
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `channel-artifacts/${peer.getNormalizeChannel}/`
    console.log('export ok'); 
    console.log(__dirname);

    shell.exec(`configtxgen -printOrg ${companyname} > ${NETWORK_PATH}channel-artifacts/${peer.getNormalizeChannel}/${companyname}.json`) 
    console.log('JSONified success');
    chdir(filePath) // then set it again to prevent error
    console.log('sth sth');
}    

async function fetchConfig(PeerOrganization, OrdererOrganization) {
    // 2 organization objects 
    // PeerOrganization = peer object that is a member of the channel
    // OdererOrganization = orderer of the channel
    // Impersonating a member of the channel
    shell.env["PATH"] = __dirname + "/../bin/:" + shell.env["PATH"] // set path to bin
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `channel-config/${PeerOrganization.getNormalizeChannel}` // path to configtx of the channel
    shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
    shell.env["CORE_PEER_LOCALMSPID"] = `${PeerOrganization.peerMSPID}`
    shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer.${PeerOrganization.getNormalizeOrg}/tls/ca.crt`
    shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/msp`
    shell.env["CORE_PEER_ADDRESS"] = `localhost: ${PeerOrganization.peerPort}`

    // fetch the latest config block
    shell.exec(`peer channel fetch config ${NETWORK_PATH}channel-artifacts/${OrdererOrganization.getNormalizeChannel}/config_block.pb -o localhost:${OrdererOrganization.ordererPort} -c ${OrdererOrganization.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}organizations/${OrdererOrganization.getNormalizeChannel}/ordererOrganizations/${OrdererOrganization.getNormalizeOrg}/msp/tlscacerts/tls-localhost-${OrdererOrganization.caPort}-ca-orderer-${OrdererOrganization.getNormalizeOrg.replace(".", "-")}.pem"`)
    // if * not working then replace with this tls-localhost-8054-ca-orderer-company-c.pem
    chdir(UTIL_PATH) // change back to prevent error
    console.log('fetch done');
    
}

async function decodeConfig(blockName, channelName) {
    // blockName = name of the block to be decode

    shell.env["PATH"] = __dirname + `/../bin/:` + shell.env["PATH"] // set path to bin
    // Convert config block to json
    shell.exec(`configtxlator proto_decode --input ${NETWORK_PATH}channel-artifacts/${channelName}/${blockName}.pb --type common.Block --output ../leopard-network/channel-artifacts/${channelName}/${blockName}.json`)
    console.log('decode done');
    console.log(__dirname);
}

//add the Org3.json to config.json
async function updateConfig(configName, companyName, channelName) {

    //shell.env["PATH"] = NETWORK_PATH + `channel-artifacts/${channelName}` + shell.env["PATH"]
    let path = NETWORK_PATH + `/channel-artifacts/${channelName}/`

    var data1 = fs.readFileSync(path + `${configName}.json`);
    var myObject1 = JSON.parse(data1);

    var data2 = fs.readFileSync(path + `${companyName}.json`);
    var myObject2 = JSON.parse(data2);

    myObject1.data.data[0].payload.data.config.channel_group.groups.Application.groups[`${companyName}.msp`] = myObject2

    fs.writeFileSync(path + "modified_config.json", JSON.stringify(myObject1, null, 4)) //
    console.log('sth sth');
}

async function main() {
    let a = new PeerOrganization("Company A", 'admin', 'password', 'admin', 'password', 'channel1', 6054)
    let orderer = new OrdererOrganization("Company C", 'ordererAdmin', 'ordererPassword', 'admin', 'password', 'channel1', 8054)
    let d = new PeerOrganization("Company D", 'admin', 'password', 'admin', 'password', 'channel1', 4054)
    await createConfigtx(d)
    await fetchConfig(a,orderer)
    await decodeConfig("config_block", "channel1")
    await updateConfig("config_block", `${d.getNormalizeOrg}`, "channel1")
}

main()