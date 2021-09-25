#/bin/bash

echo "[+] Removing channel"
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/org0/msp/tlscacerts/tls-ca-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/org0/orderers/orderer0/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/org0/orderers/orderer0/tls/server.key

osnadmin channel remove --channelID channel1 --ca-file "$ORDERER_CA" --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY" -o localhost:7053

# remove directory
echo "[+] Remove directory"
docker-compose -f docker/docker-compose.yaml down
docker-compose -f docker/docker-compose-ca.yaml down all
rm -r organizations

rm -r channel-artifacts

echo "[+] Done"
