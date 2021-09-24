#!/bin/bash
tput setaf 7

cd organizations/peerOrganizations/org1
export FABRIC_CA_CLIENT_HOME=$PWD

# Create ORG1
cp ../../../server-config/peerOrganizations/org1/config.yaml msp/

echo "[+] Generating the peer0 msp and enroll peer0 to /msp folder"
fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir peers/peer0/msp/
cp ../../../server-config/peerOrganizations/org1/config.yaml peers/peer0/msp

# Step for adding user public key for login
echo "[+] Generating the peer0-tls certificates to /tls folder"
fabric-ca-client enroll -d -u https://peer0:peer0pw@localhost:7055 --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir peers/peer0/tls

echo "[+] Generate ORG1 admin msp"
fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir peers/peer0/msp/user/admin/msp
cp msp/config.yaml peers/peer0/msp/user/admin/msp

echo "[+] Generate Org1 user1 msp"
fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --csr.hosts 'localhost' --tls.certfiles ../tls-root-cert/tls-ca-cert.pem --mspdir peers/peer0/msp/user/user1/msp
cp msp/config.yaml peers/peer0/msp/user/user1/msp

echo "[+] Generate Organization MSP folder"
# change name for ez handle
mv peers/peer0/tls/keystore/* peers/peer0/tls/keystore/server.key

# create certificate folders for ORG1 MSP
mkdir msp/{cacerts,tlscacerts}
# cp CA server public key
cp ../../fabric-ca-server/org-ca/ca-cert.pem msp/cacerts/
# cp TLS CA server public key
cp ../../fabric-ca-server/tls-ca/ca-cert.pem msp/tlscacerts/tls-ca-cert.pem

# cd back
cd ../../