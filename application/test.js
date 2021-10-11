const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const path = require("path");
const { chdir, cwd } = require('process');

/**
 * Peer CA using 2 port:
 *  - port: ca orderer listen address
 *  - 1`port`: ca oredere operation address
 * Peer Using 3 port:
 *  - peerPort = port + 1: listen port for peer
 *  - peerPort + 1: peer chaincode address
 *  - 1`peerPort`:  Peer operation listenaddress
 * CouchDB use 1 port
 *  - couchDBport = port + 3
 */
async function creatPeerAndCA(organization, port, username, password, channel) {
    organization = organization.replace(" ", ".").toLowerCase(); // normalize data
    channel = channel.replace(" ", ".").toLowerCase(); // normalize data

    let file = fs.readFileSync(__dirname + "/../leopard-network/sample/test-docker-compose-ca.yaml")
    let yamlFile = yaml.load(file.toString());

    // add volumn for peer
    yamlFile.volumes[`peer.${organization}`] = null
    
    //=================For CA====================
    let caDockerConfig = yamlFile.services["ca.server"]

    // general config
    caDockerConfig.container_name = `ca.${organization}` // set container name
    caDockerConfig.volumes = [`../../organizations/${channel}/fabric-ca-server/ca-${organization}:/etc/hyperledger/fabric-ca-server`] // mount points arrays
    caDockerConfig.command = `sh -c 'fabric-ca-server start -b ${username}:${password} -d'` // lauch with username and password
    caDockerConfig.ports = [`${port}:${port}`, `1${port}:1${port}`]

    // add enviroment variable to caConfig
    let caEnvConfig = [
      `FABRIC_CA_SERVER_CA_NAME=ca-${organization}`,
      `FABRIC_CA_SERVER_PORT=${port}`,
      `FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS=0.0.0.0:1${port}`,
    ];
    caDockerConfig.environment = caDockerConfig.environment.concat(caEnvConfig)

    // save file
    yamlFile.services[`ca.${organization}`] = caDockerConfig
    delete yamlFile.services["ca.server"]

    //=================For Peer====================
    let peerDockerConfig = yamlFile.services["peer.server"]
    let peerPort = port + 1 // peer run at port 1 higher than orderer

    //general config
    peerDockerConfig.container_name = `peer.${organization}`
    peerDockerConfig.ports = [`${peerPort}:${peerPort}`, `1${peerPort}:1${peerPort}`] 

    let peerEnvConfig = [
        `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=nft-network`,
        `CORE_PEER_ID=peer.${organization}`,
        `CORE_PEER_ADDRESS=peer.${organization}:${peerPort}`,
        `CORE_PEER_LISTENADDRESS=0.0.0.0:${peerPort}`,
        `CORE_PEER_CHAINCODEADDRESS=peer.${organization}:${peerPort + 1}`, // chaincode at 1 higher port than peer
        `CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${peerPort + 1}`,
        `CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer.${organization}:${peerPort}`,
        `CORE_PEER_GOSSIP_BOOTSTRAP=peer.${organization}:${peerPort}`,
        `CORE_PEER_LOCALMSPID=${organization}.msp`,
        `CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:1${peerPort}`,
        `CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp/user/admin/msp`,
        `CORE_LEDGER_STATE_STATEDATABASE=CouchDB`,
        `CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb.${organization}:5984`, // mapp with internal couchDB address (not localhost)
        `CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=${username}`,
        `CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=${password}`
    ]
    peerDockerConfig.environment = peerDockerConfig.environment.concat(peerEnvConfig)

    let peerVolumn = [
        `../../organizations/${channel}/peerOrganizations/${organization}/peers/peer-${organization}/msp:/etc/hyperledger/fabric/msp`,
        `../../organizations/${channel}/peerOrganizations/${organization}/peers/peer-${organization}/tls:/etc/hyperledger/fabric/tls`,
        `peer.${organization}:/var/hyperledger/production`
    ]
    peerDockerConfig.volumes = peerDockerConfig.volumes.concat(peerVolumn)
    // peerDockerConfig.depends_on = `couchdb.${organization}`
    // save file
    yamlFile.services[`peer.${organization}`] = peerDockerConfig
    delete yamlFile.services["peer.server"]

    //===========================For CouchDB============================
    let couchDBConfig = yamlFile.services["couchdb"]
    let couchdbPort = port + 3
    couchDBConfig.container_name = `couchdb.${organization}`
    couchDBConfig.environment = [
        `COUCHDB_USER=${username}`,
        `COUCHDB_PASSWORD=${password}`
    ]
    couchDBConfig.ports = [`${couchdbPort}:5984`] // use to expose couchDB port to outside (5984 is operation port of couchDB)

    // save file
    yamlFile.services[`couchdb.${organization}`] = couchDBConfig
    delete yamlFile.services["couchdb"]

    // save to file
    let filePath = __dirname + `/../leopard-network/docker/${channel}`
    if (!fs.existsSync(filePath)) { // if note create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/ca_peer-compose-${organization}.yaml`, yaml.dump(yamlFile, { lineWidth: -1 }))


    // run shell
    let oldPwd = __dirname // save old location
    shell.env["PATH"] = __dirname + "/../bin/:" + shell.env["PATH"] // commennt this if alread set env
    shell.exec(`bash -c 'cd ../leopard-network/scripts; ./upPeerAndCA.sh ${organization} ${username} ${password} ${port} peer${username} peer${password} ${channel}; cd ../../application; pwd'`)
    chdir(oldPwd) // then set it again to prevent error
}

/**
 * Ordere CA using 2 port:
 *  - port: ca orderer listen address
 *  - 1`port`: ca oredere operation address
 * Orderer Using 3 port:
 *  - ordererPort = port + 1: listen port for orderer
 *  - ordererPort + 1: Ordere_admin port use for tool osnadmin
 *  - 1`ordererPort`:  Orderer operation listenaddress
 */
async function createOrdererAndCA(organization, port, channelAdminUsername, channelAdminPassword, channel) {
    organization = organization.replace(" ", ".").toLowerCase(); // normalize data
    channel = channel.replace(" ", ".").toLowerCase(); // normalize data

    let file = fs.readFileSync(__dirname + "/../leopard-network/sample/orderer-docker-compose.yaml")
    let yamlFile = yaml.load(file.toString());

    // add volumn for peer
    yamlFile.volumes[`orderer.${organization}`] = null

    //=================For CA====================
    let caDockerConfig = yamlFile.services["ca.orderer"]

    // general config
    caDockerConfig.container_name = `ca.orderer.${organization}` // set container name
    caDockerConfig.volumes = [`../../organizations/${channel}/fabric-ca-server/ca.orderer-${organization}:/etc/hyperledger/fabric-ca-server`] // mount points arrays
    caDockerConfig.command = `sh -c 'fabric-ca-server start -b ${channelAdminUsername}:${channelAdminPassword} -d'` // lauch with username and password
    caDockerConfig.ports = [`${port}:${port}`, `1${port}:1${port}`] // set port

    // add enviroment variable to caConfig
    let caEnvConfig = [
      `FABRIC_CA_SERVER_CA_NAME=ca.orderer-${organization}`,
      `FABRIC_CA_SERVER_PORT=${port}`,
      `FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS=0.0.0.0:1${port}`,
    ];
    caDockerConfig.environment = caDockerConfig.environment.concat(caEnvConfig)

    // save file
    yamlFile.services[`ca.orderer.${organization}`] = caDockerConfig
    delete yamlFile.services["ca.orderer"]

    //=================For Orderer====================
    let ordererDockerConfig = yamlFile.services["orderer.server"]
    let ordererPort = port + 1

    // general config
    ordererDockerConfig.container_name = `orderer.${organization}` // set container name
    ordererDockerConfig.ports = [
      `${ordererPort}:${ordererPort}`,
      `1${ordererPort}:1${ordererPort}`,
      `${ordererPort + 1}:${ordererPort + 1}`, //  port for ORDERER admin listnet addres
    ];

    let ordererEnv = [
        `ORDERER_GENERAL_LISTENADDRESS=0.0.0.0`,
        `ORDERER_GENERAL_LISTENPORT=${ordererPort}`,
        `ORDERER_GENERAL_LOCALMSPID=orderer.${organization}.msp`,
        `ORDERER_ADMIN_LISTENADDRESS=0.0.0.0:${ordererPort + 1}`, // rememeber to connect this port when use osnadmin tool
        `ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:1${ordererPort}`
    ]
    ordererDockerConfig.environment = ordererDockerConfig.environment.concat(ordererEnv)

    let ordererVolumn = [
        `\${PWD}/../../channel-artifacts/${channel}/genesis_block.pb:/var/hyperledger/orderer/orderer.genesis.block`,  // use absolute path for prevent error from docker
        `../../organizations/${channel}/ordererOrganizations/${organization}/orderers/orderer-${organization}/msp:/var/hyperledger/orderer/msp`,
        `../../organizations/${channel}/ordererOrganizations/${organization}/orderers/orderer-${organization}/tls/:/var/hyperledger/orderer/tls`,
        `orderer.${organization}:/var/hyperledger/production/orderer`
    ]

    ordererDockerConfig.volumes = ordererVolumn

    yamlFile.services[`orderer.${organization}`] = ordererDockerConfig
    delete yamlFile.services["orderer.server"]

    // save to file
    let filePath = __dirname + `/../leopard-network/docker/${channel}`
    if (!fs.existsSync(filePath)) { // if note create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/orderer-compose-${organization}.yaml`, yaml.dump(yamlFile, { lineWidth: -1 }))

    // run shell
    let oldPwd = __dirname // old location
    shell.env["PATH"] =  __dirname + "/../bin/:" + shell.env["PATH"] // commennt this if alread set env
    shell.exec(`bash -c 'cd ../leopard-network/scripts; ./upOrdererAndCA.sh ${organization} ${channelAdminUsername} ${channelAdminPassword} ${port} orderer${channelAdminUsername} peer${channelAdminPassword} ${channel}; cd ../../application; pwd'`)
    chdir(oldPwd) // then set it again to prevent error
}

// note: 1 organizationw will host orderer and 1 peer. Other org can host 1 peer only
async function main() {
    await creatPeerAndCA("Company A", 6054, 'admin', 'password', 'channel1')
    await creatPeerAndCA("Company B", 7054, 'admin', 'password', 'channel1')
    await createOrdererAndCA("Company C", 8054, 'ordererAdmin', 'ordererPassword', 'channel1')
}

main()