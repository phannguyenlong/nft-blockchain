## Disclaimer: This is project use for project Subject
For how to deploy server: https://longshrim.notion.site/How-to-setup-for-window-4f2dbd1ea1f944d8b238614a9b6fc363

# Annouce new folder structure
 
There will 2 main folder:

- `application`: Holding all javascript 
- `leopard-network`: a folder for holding all inforamation about the deployed network (after deployed)

**NOTE:** Other folder or scripts inside the github are `deprecated`

## Folder structure of `leopard-network`

├───channel-artifacts
|   ├───channel1
|   |   ├───genesis_block.pb
|   ├───channel2
|       ├───geneisi_block.pb
├───channel-config
|   ├───channel1
|   |   ├───configtx.yaml
|   ├───channel2
|       ├───configtx.yaml
├───docker
|   ├───channel1
|   |   ├───orderer-company.a.yaml
|   |   ├───peer_ca-company.b.yaml
|   |   ├───...
|   ├───channel2
|   |   ├───orderer-company.c.yaml
|   |   ├───peer_ca-company.d.yaml
|       ├───...
├───organizations
|   ├───channel1
|   |   ├───fabric-ca-client
|   |   ├───fabric-ca-server
|   |   ├───peerOrganizations
|   |   |   ├───company.a
|   |   |       ├───msp
|   |   |       ├───peers
|   |   |           ├───peer.comany.a
|   |   |               ├───msp
|   |   |               ├───tls
|   |   ├───ordererOrganizations
|   |   |   ├───company.b
|   |   |       ├───msp
|   |   |       ├───orderes
|   |   |           ├───orderer.comany.b
|   |   |               ├───msp
|   |   |               ├───tls
|   ├───channel2
|   |   ├───...
├───sample
└───scripts

- **/channel-artifacts:** Store the genesis block to join channel
- **/channel-config:** Store the `configtx.yaml` use to create genesis block
- **/docker:** Store al the `yaml` file that contain information about running container *(which is peer, orderer and CAs)
- **/organizations** Store all the credentials, certificate of deployed peer, orderer
- **/sample:** Store all the sample `yaml` file to generate other files
- **/scripts:** Store all the `.sh` script to interact with the network