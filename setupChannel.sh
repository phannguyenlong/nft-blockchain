# cretea geneisis block
configtxgen -profile TwoOrgsApplicationGenesis -outputBlock channel-artifacts/genesis_block.pb -channelID channel1 -configPath test-config

osnadmin channel join --channelID channel1  --config-block channel-artifacts/genesis_block.pb -o localhost:8056 \
    --ca-file test/organizations/channel1/ordererOrganizations/company.c/msp/tlscacerts/tls-localhost-8054-ca-orderer-company-c.pem \
    --client-cert test/organizations/channel1/ordererOrganizations/company.c/orderers/orderer-company.c/tls/server.crt \
    --client-key test/organizations/channel1/ordererOrganizations/company.c/orderers/orderer-company.c/tls/server.key

docker cp channel-artifacts/genesis_block.pb  peer.company.a:/etc/hyperledger/fabric/assets

# run 
# peer channel join -b assets/genesis_block.pb --tls --cafile tls/ca.crt   -o localhost:8055