#!/bin/bash

tput setaf 1 # make all output red

# Create directory
echo "[+] Create folder"
mkdir -p organizations/{fabric-ca-client,fabric-ca-server,ordererOrganizations,peerOrganizations} # folder of type of organizations

# CA organizations
mkdir -p organizations/fabric-ca-server/{org-ca,tls-ca} 
mkdir -p organizations/fabric-ca-server/org-ca/tls

mkdir -p organizations/fabric-ca-client/{tls-ca,tls-root-cert,org-ca}

# Orderer Organzations
mkdir -p organizations/ordererOrganizations/org0/{msp,orderers}
mkdir -p organizations/ordererOrganizations/org0/orderers/orderer0/{msp,tls} # 1 peer for now

# Peer Organzations
mkdir -p organizations/peerOrganizations/{org1,org2}/{msp,peers}
mkdir -p organizations/peerOrganizations/org1/peers/peer0/{msp,tls} # 1 peer for now

# copy config
cp server-config/ca-server/tls-ca/fabric-ca-server-config.yaml organizations/fabric-ca-server/tls-ca/
cp server-config/ca-server/org-ca/fabric-ca-server-config.yaml organizations/fabric-ca-server/org-ca/
cp server-config/ca-server-client/fabric-ca-client-config.yaml organizations/fabric-ca-client/

# Run and config TLS CA server
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' -
echo "[+] Start up TLS CA server"
docker-compose -f docker/docker-compose-ca.yaml up -d tls.ca.server
tput setaf 1 # make all output red

echo "[+] Wait 3s for key to generate"
sleep 3

# cp file
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' -
echo "[+] Enroll TLS CA admin"
cp organizations/fabric-ca-server/tls-ca/ca-cert.pem organizations/fabric-ca-client/tls-root-cert/tls-ca-cert.pem 

source scripts/enroll_TLSCA_user.sh

# Run and config Organization CA server
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' -
echo "[+] Start up Organization CA server"

# copy pubic/private key of TLS Ceritificate generate by TlS CA for inital CA server with TLS
cp organizations/fabric-ca-client/tls-ca/rcaadmin/msp/signcerts/cert.pem organizations/fabric-ca-server/org-ca/tls/
cp organizations/fabric-ca-client/tls-ca/rcaadmin/msp/keystore/key.pem organizations/fabric-ca-server/org-ca/tls/

docker-compose -f docker/docker-compose-ca.yaml up -d org.ca.server
tput setaf 1 # make all output red

echo "[+] Wait 3s for key to generate"
sleep 3

source scripts/enroll_CA_user.sh

tput setaf 1 # make all output red
echo "[+] Creating Peer Organization1"
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' -
. scripts/createOrg.sh
cp -R organizations/fabric-ca-client/tls-root-cert organizations/peerOrganizations/
createOrg1
cp -R organizations/fabric-ca-client/tls-root-cert organizations/ordererOrganizations/
createOrderer

tput setaf 1 # make all output red
# Creaet genesis block for channel 1
mkdir channel-artifacts/
echo "[+] Create Genesis block"
configtxgen -profile genesis -outputBlock channel-artifacts/genesis_block.pb -channelID channel1

echo "[+] Start up Peer0 Server"
docker-compose -f docker/docker-compose.yaml up -d

tput setaf 1 # make all output red
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' -
echo "[+] Creating channel"
source scripts/createChannel.sh

echo "[+] Done"