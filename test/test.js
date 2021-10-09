const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs')

async function creatPeerAndCA(organization, port, username, password) {
    organization = organization.replace(" ", ".").toLowerCase(); // normalize data

    let file = fs.readFileSync(__dirname + "/../docker/test-docker-compose-ca.yaml")
    let yamlFile = yaml.load(file.toString());

    // add volumn for peer
    yamlFile.volumes[`peer.${organization}`] = null
    
    //=================For CA====================
    let caDockerConfig = yamlFile.services["ca.server"]

    // general config
    caDockerConfig.container_name = `ca.${organization}` // set container name
    caDockerConfig.volumes = [`../organizations/fabric-ca-server/ca-${organization}:/etc/hyperledger/fabric-ca-server`] // mount points arrays
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
        `CORE_PEER_ID=peer.${organization}`,
        `CORE_PEER_ADDRESS=peer.${organization}:${peerPort}`,
        `CORE_PEER_LISTENADDRESS=0.0.0.0:${peerPort}`,
        `CORE_PEER_CHAINCODEADDRESS=peer.${organization}:${peerPort + 1}`, // chaincode at 1 higher port than peer
        `CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${peerPort + 1}`,
        `CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer.${organization}:${peerPort}`,
        `CORE_PEER_GOSSIP_BOOTSTRAP=peer.${organization}:${peerPort}`,
        `CORE_PEER_LOCALMSPID=${organization}.msp`,
        `CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:1${peerPort}`
    ]
    peerDockerConfig.environment = peerDockerConfig.environment.concat(peerEnvConfig)

    let peerVolumn = [
        `../organizations/peerOrganizations/${organization}/peers/peer-${organization}/msp:/etc/hyperledger/fabric/msp`,
        `../organizations/peerOrganizations/${organization}/peers/peer-${organization}/tls:/etc/hyperledger/fabric/tls`,
        `peer.${organization}:/var/hyperledger/production`
    ]
    peerDockerConfig.volumes = peerDockerConfig.volumes.concat(peerVolumn)
    
    // save file
    yamlFile.services[`peer.${organization}`] = peerDockerConfig
    delete yamlFile.services["peer.server"]

    // save to file
    fs.writeFileSync(__dirname + `/docker/ca-compose-${organization}.yaml`, yaml.dump(yamlFile, { lineWidth: -1 }))


    // run shell
    shell.env["PATH"] =  __dirname + "/../bin/:" + shell.env["PATH"] // commennt this if alread set env
    shell.exec(`cd ../; ./upPeerAndCA.sh ${organization} ${username} ${password} ${port} peer pass; cd test/`)
}

creatPeerAndCA("Comnpany A", 7054, 'admin', 'password')