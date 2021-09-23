#/bin/bash

docker-compose -f docker/docker-compose-ca.yaml down all
rm -r organizations
