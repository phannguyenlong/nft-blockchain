#!/bin/bash
tput setaf 7

export FABRIC_CFG_PATH=config

# Join orderer0 to channel 1
echo "[+] Join orderer 0 to channel"
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/org0/msp/tlscacerts/tls-ca-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/org0/orderers/orderer0/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/org0/orderers/orderer0/tls/server.key

# connect to 7053 cause this is the admin port
osnadmin channel join --channelID channel1 --config-block channel-artifacts/genesis_block.pb -o localhost:7053 \
    --ca-file "$ORDERER_CA" --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY"