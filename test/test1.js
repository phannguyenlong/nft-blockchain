const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const path = require("path");
const { chdir, cwd } = require('process');
const {PeerOrganization} = require('../application/channel-utils/Organizations');
const {OrdererOrganization} = require('../application/channel-utils/Organizations');
const {Channel} = require('../application/channel-utils/Organizations');
// config path
let NETWORK_PATH = __dirname + "/../leopard-network" // path to network
let UTIL_PATH = __dirname // for comback to this file

// Some comments on naming convention of the fetch/encode/decode file
// fetchConfig file name = config_block.pb
// decodePBtoJSON: same name, different type (.pb -> .json)
// encodeJSONtoPB: same name, different type (.json -> .pb)
// PeerJoinChannel: fetching the first (0) block: block0.block // what block? is .block = .pb? .block is written as the output file extension for peer channel fetch/config/etc. in v1.1.0-alpha.doc
// submitConfigDemo: after calculating the delta -> config_update.pb -> ready for submit and sign (updated to channel)

async function createConfigtx(peer) {
    companyname = peer.getNormalizeOrg; // normalize data

    let jsonConfig = { 
        Organizations:
        [{
            Name: companyname, 
            ID: `${companyname}.msp`,
            // rememeber to change when change dir     
            MSPDir: `${NETWORK_PATH}/organizations/${peer.getNormalizeChannel}/peerOrganizations/${companyname}/msp`, 
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
    let filePath = NETWORK_PATH + `/channel-artifacts/${peer.getNormalizeChannel}`
    if (!fs.existsSync(filePath)) { // if not create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/configtx.yaml`, yaml.dump(jsonConfig, { lineWidth: -1 }))
    console.log('yaml creation sucess');

    shell.env["PATH"] = __dirname + "/../../bin/:" + shell.env["PATH"] 
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-artifacts/${peer.getNormalizeChannel}/`
    console.log('export ok'); 
    console.log(__dirname);

    shell.exec(`configtxgen -printOrg ${companyname} > ${NETWORK_PATH}/channel-artifacts/${peer.getNormalizeChannel}/${companyname}.json`) 
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
    console.log('sth sth1');
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-config/${PeerOrganization.getNormalizeChannel}` // path to configtx of the channel
    console.log('sth sth2');
    shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
    console.log('sth sth3');
    shell.env["CORE_PEER_LOCALMSPID"] = `${PeerOrganization.peerMSPID}`
    console.log('sth sth4');
    shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer.${PeerOrganization.getNormalizeOrg}/tls/ca.crt`
    console.log('sth sth5');
    shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/msp`
    console.log('sth sth6');
    shell.env["CORE_PEER_ADDRESS"] = `localhost: ${PeerOrganization.peerPort}`
    console.log('sth sth7');
    // fetch the latest config block
    shell.exec(`peer channel fetch config ${NETWORK_PATH}/channel-artifacts/${OrdererOrganization.getNormalizeChannel}/config_block.pb -o localhost:${OrdererOrganization.ordererPort} -c ${OrdererOrganization.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${OrdererOrganization.getNormalizeChannel}/ordererOrganizations/${OrdererOrganization.getNormalizeOrg}/msp/tlscacerts/tls-localhost-${OrdererOrganization.caPort}-ca-orderer-${OrdererOrganization.getNormalizeOrg.replace(".", "-")}.pem"`)
    // if * not working then replace with this tls-localhost-8054-ca-orderer-company-c.pem
    console.log('sth sth8');
    chdir(UTIL_PATH) // change back to prevent error
    console.log('fetch done');
    
}

async function decodePBtoJSON(blockName, channelName) {
    // blockName = name of the block to be decode

    shell.env["PATH"] = __dirname + `/../bin/:` + shell.env["PATH"] // set path to bin
    // Convert config block to json
    shell.exec(`configtxlator proto_decode --input ${NETWORK_PATH}/channel-artifacts/${channelName}/${blockName}.pb --type common.Block --output ../leopard-network/channel-artifacts/${channelName}/${blockName}.json`)
    console.log('decode done');
    console.log(__dirname);
}

async function encodeJSONtoPB(blockName, channelName) {
    // blockName = name of the block to be decode

    shell.env["PATH"] = __dirname + `/../bin/:` + shell.env["PATH"] // set path to bin
    console.log('sth1');
    // Convert config json back to pb
    shell.exec(`configtxlator proto_encode --input ${NETWORK_PATH}/channel-artifacts/${channelName}/${blockName}.json --type common.Config --output ../leopard-network/channel-artifacts/${channelName}/${blockName}.pb`)
    console.log(`encode ${blockName}.pb to ${blockName}.json done`);
}

//add the Org3.json to config.json
async function updateConfig(configName, companyName, channelName) {

    //shell.env["PATH"] = NETWORK_PATH + `channel-artifacts/${channelName}` + shell.env["PATH"]
    let path = NETWORK_PATH + `/channel-artifacts/${channelName}/`

    var data1 = fs.readFileSync(path + `${configName}.json`);
    var myObject1 = JSON.parse(data1);
    myObject1 = { ...myObject1.data.data[0].payload.data.config }

    fs.writeFileSync(path + `${configName}.json`, JSON.stringify(myObject1, null, 4))

    var data2 = fs.readFileSync(path + `${companyName}.json`);
    var myObject2 = JSON.parse(data2);

    myObject1.channel_group.groups.Application.groups[`${companyName}.msp`] = myObject2
    fs.writeFileSync(path + "modified_config.json", JSON.stringify(myObject1, null, 4)) //
    console.log('sth sth');
}

async function PeerJoinChannel(PeerOrganization, OrdererOrganization) {
    // 2 organization objects 
    // PeerOrganization = peer object that is the newly joined member of the channel
    // OdererOrganization = orderer of the channel

    shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
    shell.env["CORE_PEER_LOCALMSPID"] = `${PeerOrganization.peerMSPID}`
    shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer.${PeerOrganization.getNormalizeOrg}/tls/ca.crt`
    shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/msp`
    shell.env["CORE_PEER_ADDRESS"] = `localhost: ${PeerOrganization.peerPort}`

    // join channel by the genesis block
    // As a result of the successful channel update, the ordering service will verify that the new org can pull the genesis block and join the channel
    // If not successfully joined, the ordering service would reject this request
    shell.exec(`peer channel fetch 0 ${NETWORK_PATH}/channel-artifacts/${OrdererOrganization.getNormalizeChannel}/block0.block -o localhost:${OrdererOrganization.ordererPort} -c ${OrdererOrganization.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${OrdererOrganization.getNormalizeChannel}/ordererOrganizations/${OrdererOrganization.orgName}/orderers/orderer.${PeerOrganization.getNormalizeOrg}/msp/tlscacerts/*"`)
    // if * not working then replace with this tls-localhost-8054-ca-orderer-company-c.pem

    // join peer
    shell.exec(`peer channel join -b ${NETWORK_PATH}/channel-artifacts/block0.block`)
}

async function submitConfig(originalBlock, modifiedBlock, channelName) {
    // this function is for real life implementation
    // send promt to members in channel
    // wait till enough signing for update
    shell.env["PATH"] = NETWORK_PATH + `../bin:` + shell.env["PATH"] // set path to bin
    // calculate the delta between these two config protobufs
    shell.exec(`configtxlator compute_update --channel_id ${channelName} --original ${NETWORK_PATH}/channel-artifacts/${channelName}/${originalBlock}.pb --updated ${NETWORK_PATH}/channel-artifacts/${channelName}/${modifiedBlock}.pb --output ${NETWORK_PATH}/channel-artifacts/${channelName}/config_update.pb`)

    //unfinished: submit how and signing how
    // submit logic here

    // signing logic here
}

async function submitConfigDemo(originalBlock, modifiedBlock, Channel) {
    // this function is for demo only
    // logic: all peer member of the channel will sign (approve) the change
    // Channel = channel object. Channel we want to approve the modified block
    shell.env["PATH"] = NETWORK_PATH + `../bin:` + shell.env["PATH"] // set path to bin
    // calculate the delta between these two config protobufs
    // config_update.pb is now ready to submit and sign (update the channel config)
    shell.exec(`configtxlator compute_update --channel_id ${Channel.getNormalizeChannel} --original ${NETWORK_PATH}/channel-artifacts/${Channel.getNormalizeChannel}/${originalBlock}.pb --updated ${NETWORK_PATH}/channel-artifacts/${Channel.channelName}/${modifiedBlock}.pb --output ${NETWORK_PATH}/channel-artifacts/${Channel.getNormalizeChannel}/config_update.pb`)

    for (iterator = 0; iterator < Channel.peers.length; iterator++) {
        let peer = Channel.peers[iterator]

        // exported the necessary environment variables to operate as the org admin
        shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
        shell.env["CORE_PEER_LOCALMSPID"] = `${peer.peerMSPID}`
        shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${peer.getNormalizeChannel}/peerOrganizations/${peer.getNormalizeOrg}/peers/peer.${peer.getNormalizeOrg}/tls/ca.crt`
        shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${peer.getNormalizeChannel}/peerOrganizations/${peer.getNormalizeOrg}/peers/peer-${peer.getNormalizeOrg}/msp`
        shell.env["CORE_PEER_ADDRESS"] = `localhost: ${peer.peerPort}`

        // sign the update
        // might need to change path to bin for signconfigtx
        if (iterator != Channel.peers.length - 1) {
            shell.exec(`peer channel signconfigtx -f ${NETWORK_PATH}/channel-artifacts/${peer.getNormalizeChannel}/config_update.pb`)
        } else {
            // logic: the last peer sign and update 
            shell.exec(`peer channel update -f ${NETWORK_PATH}/channel-artifacts/${peer.getNormalizeChannel}/config_update.pb -o localhost:${Channel.orderer.ordererPort} -c ${Channel.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${Channel.getNormalizeChannel}/ordererOrganizations/${Channel.orderer.orgName}/orderers/orderer.${peer.getNormalizeOrg}/msp/tlscacerts/*"`)
        }
    }
}

// write main here to demo
async function main() {
    // create necessary objects
    let peerA = new PeerOrganization("Company A", 'admin', 'password', 'admin', 'password', 'channel1', 6054)
    let peerB = new PeerOrganization("Company B", 'admin', 'password', 'admin', 'password', 'channel1', 7054)
    let orderer = new OrdererOrganization("Company C", 'ordererAdmin', 'ordererPassword', 'admin', 'password', 'channel1', 8054)
    let peerD = new PeerOrganization("Company D", 'admin', 'password', 'admin', 'password', 'channel1', 4054)
    let channel1 = new Channel("channel1", orderer, [peerA, peerB])
    // first create config of the org that want to join channel
    await createConfigtx(peerD)
    // second, use a member of the channel to fetch the config block
    await fetchConfig(peerA, orderer)
    // third, decode the config block
    await decodePBtoJSON("config_block", "channel1")
    // fourth, update the config block by appending the json file in step 1
    await updateConfig("config_block", `${peerD.getNormalizeOrg}`, "channel1")
    // fifth, encode the 2 blocks back to pb
    await encodeJSONtoPB("config_block", "channel1")
    await encodeJSONtoPB("modified_config", "channel1")
    // sixth, run the demo submit&sign
    await submitConfigDemo("config_block", "modified_config", channel1)
    // this is just update the channel object
    // await channel1.addPeer(peerD)
    // // join the peer into the channel
    // await PeerJoinChannel(peerD, orderer)
}

main()
