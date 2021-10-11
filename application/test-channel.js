const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const { chdir, cwd } = require('process');

async function createChannel(orderer, peers) {
    let file = fs.readFileSync(__dirname + "/../leopard-network/sample/configtx.yaml")
    let yamlFile = yaml.load(file.toString())
    
    // build a profiles
    let configYamlFile = { Profiles: {} }
    configYamlFile.Profiles = { LeopardGenesis: {} }
    let LeopardGenesis = configYamlFile.Profiles.LeopardGenesis

    // set up Policies
    LeopardGenesis.Policies = yamlFile.Profiles.TwoOrgsApplicationGenesis.Policies

    // setup capalities
    LeopardGenesis.Capabilities = { V2_0: true }

    // set up orderer Organization
    let ordererOrg = {
        Name: `orderer.${orderer.getNormalizeOrg}`,
        ID: `orderer.${orderer.getNormalizeOrg}.msp`,
        MSPDir: `../../organizations/${orderer.getNormalizeChannel}/ordererOrganizations/${orderer.getNormalizeOrg}/msp`,
        Policies: {
            Readers: { Type: "Signature", Rule: `OR('orderer.${orderer.getNormalizeOrg}.msp.member')` },
            Writers: { Type: "Signature", Rule: `OR('orderer.${orderer.getNormalizeOrg}.msp.member')` },
            Admins: { Type: "Signature", Rule: `OR('orderer.${orderer.getNormalizeOrg}.msp.admin')` }
        },
        OrdererEndpoints: [ `orderer.${orderer.getNormalizeOrg}:${orderer.ordererPort}` ]
    }

    // set up Orderer part
    yamlFile.Orderer.Addresses = [`localhost:${orderer.ordererPort}`]
    yamlFile.Orderer.EtcdRaft = {
        Consenters: [{
            Host: 'localhost',
            Port: orderer.ordererPort,
            ClientTLSCert:
                `../../organizations/${orderer.getNormalizeChannel}/ordererOrganizations/${orderer.getNormalizeOrg}/orderers/orderer-${orderer.getNormalizeOrg}/tls/server.crt`,
            ServerTLSCert:
                `../../organizations/${orderer.getNormalizeChannel}/ordererOrganizations/${orderer.getNormalizeOrg}/orderers/orderer-${orderer.getNormalizeOrg}/tls/server.crt`,
        }]
    }
    LeopardGenesis.Orderer = yamlFile.Orderer
    LeopardGenesis.Orderer.Capabilities = { V2_0: true }
    LeopardGenesis.Orderer.Organizations = [ordererOrg]

    // setup Application part
    LeopardGenesis.Application = yamlFile.Application
    LeopardGenesis.Application.Organizations = []

    // add peer org to Application Organizations
    let peerOrgName = ""
    for (let i = 0; i < peers.length; i++) {
        let peer = peers[i]
        let peerOrg = {
            Name: `${peer.getNormalizeOrg}.msp`,
            ID: `${peer.getNormalizeOrg}.msp`,
            MSPDir: `../../organizations/${peer.getNormalizeChannel}/peerOrganizations/${peer.getNormalizeOrg}/msp`,
            Policies: {
                Readers: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.admin', '${peer.getNormalizeOrg}.msp.peer', '${peer.getNormalizeOrg}.msp.client')` },
                Writers: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.admin', '${peer.getNormalizeOrg}.msp.client')` },
                Admins: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.admin', '${peer.getNormalizeOrg}.msp.peer')` },
                Endorsement: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.peer', '${peer.getNormalizeOrg}.msp.admin')` }
            },
            AnchorPeers: [{Host: `peer.${peer.getNormalizeOrg}`, Port: peer.peerPort}]
        }
        peerOrgName = peerOrgName.concat(`${peer.getNormalizeOrg},`) // get name for sh script
        LeopardGenesis.Application.Organizations.push(peerOrg)
    }
    peerOrgName =  peerOrgName.substring(0, peerOrgName.length - 1); // remove last ","

    // wrtie to file
    let filePath = __dirname + `/../leopard-network/channel-config/${orderer.getNormalizeChannel}`
    if (!fs.existsSync(filePath)) { // if note create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + "/configtx.yaml", yaml.dump(configYamlFile, { lineWidth: -1 }))

    // run shell
    let oldPwd = __dirname // save old location
    shell.env["PATH"] = __dirname + "/../bin/:" + shell.env["PATH"] // commennt this if already set env
    shell.exec(`bash -c 'cd ../leopard-network/scripts; ./setupChannel.sh ${orderer.getNormalizeOrg} ${orderer.ordererPort} ${orderer.getNormalizeChannel} ${peerOrgName}; cd ../../application; pwd'`)
    chdir(oldPwd) // then set it again to prevent error
}

class Organization {
    constructor(orgName, caAdmin, caPassword, channelName, caPort) {
        this.orgName = orgName
        this.caAdmin = caAdmin
        this.caPassword = caPassword
        this.channelName = channelName
        this.caPort = caPort
        this.caOperationPort = `1${caPort}`
    }

    // use for getting org name like company.c
    get getNormalizeOrg() {
        return this.orgName.replace(" ", ".").toLowerCase();
    }
    
    get getNormalizeChannel() {
        return this.channelName.replace(" ", ".").toLowerCase()
    }
}

class peerOrganization extends Organization {
    constructor(orgName, caAdmin, caPassword, peerAdmin, peerPassword, channelName, portNumber) {
        super(orgName, caAdmin, caPassword, channelName, portNumber)
        this.peerAdmin = peerAdmin
        this.peerPassword = peerPassword
        this.peerPort = portNumber + 1
        this.peerOperationPort = `1${this.peerPort}`
        this.chainCodePort = this.peerPort + 1
    }
}

class ordererOrganizations extends Organization {
    constructor(orgName, caAdmin, caPassword, ordererAdmin, ordererPassword, channelName, portNumber) {
        super(orgName, caAdmin, caPassword, channelName, portNumber)
        this.ordererAdmin = ordererAdmin
        this.ordererPassword = ordererPassword
        this.ordererPort = portNumber + 1
        this.ordererOperationPort = `1${this.ordererPort}`
        this.ordererAdminPort = this.ordererPort + 1 // use by onsadmin
    }
}

let orderer = new ordererOrganizations("Company C", 'ordererAdmin', 'ordererPassword', 'admin', 'password', 'channel1', 8054)
let peers = [
    new peerOrganization("Company A", 'admin', 'password', 'admin', 'password', 'channel1', 6054),
    new peerOrganization("Company B", 'admin', 'password', 'admin', 'password', 'channel1', 7054)
]

createChannel(orderer, peers)