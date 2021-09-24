#/bin/bash

docker-compose -f docker/docker-compose.yaml down
docker-compose -f docker/docker-compose-ca.yaml down all
rm -r organizations
