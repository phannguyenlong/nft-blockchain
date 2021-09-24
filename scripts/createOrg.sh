#!/bin/bash

function createOrg1() {
    tput setaf 7

    cd organizations/peerOrganizations/org1
    export FABRIC_CA_CLIENT_HOME=$PWD

    # Create ORG1
    cp ../../../server-config/peerOrganizations/org1/config.yaml msp/

    echo "[+] Generating the peer0 msp and enroll peer0 to /msp folder"
    fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir peers/peer0/msp/
    cp ../../../server-config/peerOrganizations/org1/config.yaml peers/peer0/msp

    echo "[+] Generating the peer0 tls certificates to /tls folder"
    fabric-ca-client enroll -d -u https://peer0:peer0pw@localhost:7055 --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir peers/peer0/tls

    # Step for adding user public key for login
    echo "[+] Generate ORG1 admin msp"
    fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir peers/peer0/msp/user/admin/msp
    cp msp/config.yaml peers/peer0/msp/user/admin/msp

    echo "[+] Generate Org1 user1 msp"
    fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir peers/peer0/msp/user/user1/msp
    cp msp/config.yaml peers/peer0/msp/user/user1/msp

    echo "[+] Generate Organization MSP folder"

    # create certificate folders for ORG1 MSP
    mkdir msp/{cacerts,tlscacerts}
    # cp CA server public key
    cp ../../fabric-ca-server/org-ca/ca-cert.pem msp/cacerts/
    # cp TLS CA server public key
    cp ../../fabric-ca-server/tls-ca/ca-cert.pem msp/tlscacerts/tls-ca-cert.pem

    # change name for ez handle
    mv peers/peer0/tls/keystore/* peers/peer0/tls/keystore/server.key
    mv msp/cacerts/* msp/cacerts/localhost-7054-ca-org.pem
    mv peers/peer0/msp/cacerts/* peers/peer0/msp/cacerts/localhost-7054-ca-org.pem
    mv peers/peer0/msp/user/admin/msp/cacerts/* peers/peer0/msp/user/admin/msp/cacerts/localhost-7054-ca-org.pem
    mv peers/peer0/msp/user/user1/msp/cacerts/* peers/peer0/msp/user/user1/msp/cacerts/localhost-7054-ca-org.pem

    # use for creating peers
    cp peers/peer0/tls/tlscacerts/* peers/peer0/tls/ca.crt
    cp peers/peer0/tls/signcerts/* peers/peer0/tls/server.crt
    cp peers/peer0/tls/keystore/* peers/peer0/tls/server.key

    # cd back
    cd ../../../
}

function createOrderer() {
    tput setaf 7

    cd organizations/ordererOrganizations/org0
    export FABRIC_CA_CLIENT_HOME=$PWD

    # Create ORG0
    cp ../../../server-config/ordererOganizations/org0/config.yaml msp/

    echo "[+] Generating Orderer MSP to /msp folder"
    fabric-ca-client enroll -u https://orderer0:orderer0pw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir orderers/orderer0/msp
    cp ../../../server-config/ordererOganizations/org0/config.yaml orderers/orderer0/msp

    echo "[+] Generating the orderer0 tls certificates to /tls folder"
    fabric-ca-client enroll -d -u https://orderer0:orderer0pw@localhost:7055 --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir orderers/orderer0/tls

    # Step for adding user public key for login
    echo "[+] Generate ORG0 admin msp"
    fabric-ca-client enroll -u https://ordereradmin:ordereradminpw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir orderers/orderer0/msp/user/admin/msp
    cp msp/config.yaml orderers/orderer0/msp/user/admin/msp

    echo "[+] Generate Organization MSP folder"
    # create certificate folders for ORG0 MSP
    mkdir msp/{cacerts,tlscacerts}
    # cp CA server public key
    cp ../../fabric-ca-server/org-ca/ca-cert.pem msp/cacerts/
    # cp TLS CA server public key
    cp ../../fabric-ca-server/tls-ca/ca-cert.pem msp/tlscacerts/tls-ca-cert.pem

    # change name for ez handle
    mv msp/cacerts/* msp/cacerts/localhost-7054-ca-org.pem
    mv orderers/orderer0/msp/cacerts/* orderers/orderer0/msp/cacerts/localhost-7054-ca-org.pem
    mv orderers/orderer0/msp/user/admin/msp/cacerts/* orderers/orderer0/msp/user/admin/msp/cacerts/localhost-7054-ca-org.pem

    # use for creating peers
    cp orderers/orderer0/tls/tlscacerts/* orderers/orderer0/tls/ca.crt
    cp orderers/orderer0/tls/signcerts/* orderers/orderer0/tls/server.crt
    cp orderers/orderer0/tls/keystore/* orderers/orderer0/tls/server.key

    # cd back
    cd ../../../
}