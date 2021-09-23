#!/bin/bash
tput setaf 7

cd organizations/fabric-ca-client
export FABRIC_CA_CLIENT_HOME=$PWD

echo "[+] Enroll Organizations CA admin"
fabric-ca-client enroll -d -u https://rcaadmin:rcaadminpw@localhost:7054 --tls.certfiles tls-root-cert/tls-ca-cert.pem --csr.hosts 'localhost' --mspdir org-ca/rcaadmin/msp