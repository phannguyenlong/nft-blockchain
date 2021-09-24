#!/bin/bash
tput setaf 7

cd organizations/fabric-ca-client
export FABRIC_CA_CLIENT_HOME=$PWD

echo "[+] Enrolling TLS CA admin"
fabric-ca-client enroll -d -u https://admin:adminpw@localhost:7055 --tls.certfiles tls-root-cert/tls-ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir tls-ca/tlsadmin/msp

echo "[+] Use TLS CA admin MSP to register and enroll for Orgarnization CA server"
fabric-ca-client register -d --id.name rcaadmin --id.secret rcaadminpw -u https://localhost:7055  --tls.certfiles tls-root-cert/tls-ca-cert.pem --mspdir tls-ca/tlsadmin/msp
fabric-ca-client enroll -d -u https://rcaadmin:rcaadminpw@localhost:7055 --tls.certfiles tls-root-cert/tls-ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir tls-ca/rcaadmin/msp

# change private key name for ez handle
mv tls-ca/rcaadmin/msp/keystore/* tls-ca/rcaadmin/msp/keystore/key.pem
mv tls-ca/tlsadmin/msp/keystore/* tls-ca/tlsadmin/msp/keystore/key.pem


echo "[+] Registering Org1 Peer0"
fabric-ca-client register -d --id.name peer0 --id.secret peer0pw -u https://localhost:7055  --tls.certfiles tls-root-cert/tls-ca-cert.pem --mspdir tls-ca/tlsadmin/msp

# cd back
cd ../../