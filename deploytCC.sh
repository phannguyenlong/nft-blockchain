#package chaincode
peer lifecycle chaincode package test.tar.gz --path admin-chaincode --lang node --label test_1.0

# copy chaincode to peer
docker cp test.tar.gz  peer.company.a:/etc/hyperledger/fabric/test.tar.gz
docker cp test.tar.gz  peer.company.b:/etc/hyperledger/fabric/test.tar.gz

# copy orderer tls certificate to peer
docker cp leopard-network/organizations/channel1/ordererOrganizations/company.c/msp/tlscacerts/tls-localhost-8054-ca-orderer-company-c.pem  peer.company.a:/etc/hyperledger/fabric/ca.crt
docker cp leopard-network/organizations/channel1/ordererOrganizations/company.c/msp/tlscacerts/tls-localhost-8054-ca-orderer-company-c.pem  peer.company.b:/etc/hyperledger/fabric/ca.crt

# install chaincode on peer
sleep 3
docker exec peer.company.a sh -c "peer lifecycle chaincode install /etc/hyperledger/fabric/test.tar.gz"
# sleep 3
docker exec peer.company.b sh -c "peer lifecycle chaincode install /etc/hyperledger/fabric/test.tar.gz"

# approve chanicdoe
#docker exec peer.company.a sh -c "peer lifecycle chaincode approveformyorg -o orderer.company.c:8055 --channelID channel1 --name test --version 1.0 --package-id  --sequence 1 --tls --cafile ca.crt"
#docker exec peer.company.a sh -c "peer lifecycle chaincode approveformyorg -o orderer.company.c:8055 --channelID channel1 --name test --version 1.0 --package-id  --sequence 1 --tls --cafile ca.crt"


#peer lifecycle chaincode checkcommitreadiness --channelID channel1 --name test --version 1.0 --sequence 1 --tls --cafile ca.crt  --output json

#peer lifecycle chaincode commit -o orderer.company.c:8055 --channelID channel1 --name test --version 1.0 --sequence 1 --tls --cafile ca.crt

docker cp leopard-network/organizations/channel1/peerOrganizations/company.b/peers/peer-company.b/tls/ca.crt peer.company.a:/etc/hyperledger/fabric/ca.b.crt

# peer lifecycle chaincode commit -o orderer.company.c:8055 --channelID channel1 --name test --version 1.0 --sequence 1 \
#     --tls --cafile ca.crt --peerAddresses peer.company.b:7055 --tlsRootCertFiles ca.b.crt \
#     --peerAddresses peer.company.a:6055 --tlsRootCertFiles tls/ca.crt

# check commit
# peer lifecycle chaincode querycommitted --channelID channel1 --name test --cafile tls/ca.crt


# invoke chanincode
# peer chaincode invoke -o orderer.company.c:8055 --tls --cafile ca.crt -C channel1 -n test \
#     --peerAddresses peer.company.a:6055 --tlsRootCertFiles tls/ca.crt \
#     --peerAddresses peer.company.b:7055 --tlsRootCertFiles ca.b.crt \
#     -c '{"function":"InitLedger","Args":[]}'