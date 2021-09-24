#!/bin/bash
tput setaf 7

cd organizations/fabric-ca-client
export FABRIC_CA_CLIENT_HOME=$PWD

echo "[+] Enroll Organizations CA admin"
fabric-ca-client enroll -d -u https://rcaadmin:rcaadminpw@localhost:7054 --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp

# Set up for Org1 peer 0

echo "[+] Registering Org1 peer0"
fabric-ca-client register -d --id.name peer0 --id.secret peer0pw -u https://localhost:7054 --id.type peer --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp

echo "[+] Registering Org1 user"
fabric-ca-client register -d --id.name user1 --id.secret user1pw -u https://localhost:7054 --id.type user --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp

echo "[+] Register Organizations org1 admin"
fabric-ca-client register -d --id.name org1admin --id.secret org1adminpw -u https://localhost:7054 --id.type admin --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp

# Set up for Org0 orderer 0
echo "[+] Registering Org0 orderer0"
fabric-ca-client register -d --id.name orderer0 --id.secret orderer0pw -u https://localhost:7054 --id.type orderer --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp

echo "[+] Registering Org0 admin"
fabric-ca-client register -d --id.name ordereradmin --id.secret ordereradminpw -u https://localhost:7054 --id.type admin --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp

# cd back
cd ../../