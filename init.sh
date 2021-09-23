#!/bin/bash

tput setaf 1 # make all output red

# Create directory
echo "[+] Create folder"
mkdir -p organizations/fabric-ca-client organizations/fabric-ca-server

mkdir -p organizations/fabric-ca-server/org-ca organizations/fabric-ca-server/tls-ca
mkdir -p organizations/fabric-ca-server/org-ca/tls

mkdir -p organizations/fabric-ca-client/tls-ca organizations/fabric-ca-client/tls-root-cert organizations/fabric-ca-client/org-ca

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

cp organizations/fabric-ca-client/tls-ca/rcaadmin/msp/signcerts/cert.pem organizations/fabric-ca-server/org-ca/tls/
cp organizations/fabric-ca-client/tls-ca/rcaadmin/msp/keystore/key.pem organizations/fabric-ca-server/org-ca/tls/

docker-compose -f docker/docker-compose-ca.yaml up -d org.ca.server
tput setaf 1 # make all output red

echo "[+] Wait 3s for key to generate"
sleep 3

source scripts/enroll_CA_user.sh