#!/bin/bash

# Start up CA server
# upPeerAndCA.sh company_name ca_username ca_password ca_port peer_username peer_password
# test: ./upPeerAndCA.sh comnpany.a admin password 7054 peer pass


function generatePeerMSP() {
    CAPATH="$PWD/../fabric-ca-server/ca-$1"
    export FABRIC_CA_CLIENT_HOME=$PWD

    # enroll CA admin
    echo "[+] Enroll CA admin"
    fabric-ca-client enroll -d -u https://$2:$3@localhost:$4 --caname ca-$1 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts 'localhost' --mspdir ca-$1/admin/msp
    
    # Use CA admin for regsier peer
    echo "[+] Register Peer identity"
    fabric-ca-client register -d --id.name $5 --id.secret $6 --id.type peer -u https://localhost:$4 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts 'localhost' --mspdir ca-$1/admin/msp

    # Enroll peer indentity
    echo "[+] Enroll peer identity"
    fabric-ca-client enroll -u https://$5:$6@localhost:$4 --caname ca-$1 --csr.hosts 'localhost' --tls.certfiles $CAPATH/ca-cert.pem --mspdir ../peerOrganizations/$1/peers/peer-$1/msp
    echo "[+] Generate peer tls certificate"
    fabric-ca-client enroll -d -u https://$5:$6@localhost:$4 --caname ca-$1 --tls.certfiles $CAPATH/ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir ../peerOrganizations/$1/peers/peer-$1/tls

    # use for create peer
    cp ../peerOrganizations/$1/peers/peer-$1/tls/tlscacerts/* ../peerOrganizations/$1/peers/peer-$1/tls/ca.crt
    cp ../peerOrganizations/$1/peers/peer-$1/tls/signcerts/* ../peerOrganizations/$1/peers/peer-$1/tls/server.crt
    cp ../peerOrganizations/$1/peers/peer-$1/tls/keystore/* ../peerOrganizations/$1/peers/peer-$1/tls/server.key
    mkdir ../peerOrganizations/$1/msp # channel MSP

    # config.yaml for peers
    ORGNAME=`echo  $1 | tr "." -` # replace . to - in order to match the name
    echo "NodeOUs:
    Enable: true
    ClientOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: orderer" > "../peerOrganizations/$1/msp/config.yaml"
    
    cp ../peerOrganizations/$1/msp/config.yaml ../peerOrganizations/$1/peers/peer-$1/msp/config.yaml

    # creating ORG MSP for Organization
    mkdir ../peerOrganizations/$1/msp/{cacerts,tlscacerts}
    cp ../peerOrganizations/$1/peers/peer-$1/msp/cacerts/* ../peerOrganizations/$1/msp/cacerts
    cp ../peerOrganizations/$1/peers/peer-$1/tls/tlscacerts/* ../peerOrganizations/$1/msp/tlscacerts
}

# lauch docker CA container
docker-compose -f test/docker/ca-compose-$1.yaml up -d ca.server

cd test/organizations
mkdir fabric-ca-client
cd fabric-ca-client
generatePeerMSP $1 $2 $3 $4 $5 $6

cd ../../../

# Launch peer container
docker-compose -f test/docker/ca-compose-$1.yaml up -d peer.server