class Organization {
    constructor(orgName, caAdmin, caPassword, channelName, caPort) {
        this.orgName = orgName
        this.caAdmin = caAdmin
        this.caPassword = caPassword
        this.channelName = channelName
        this.caPort = caPort
        this.caOperationPort = `1${caPort}`
    }

    // use for getting org name like company.c
    get getNormalizeOrg() {
        return this.orgName.replace(" ", ".").toLowerCase();
    }
    
    get getNormalizeChannel() {
        return this.channelName.replace(" ", ".").toLowerCase()
    }
}

class PeerOrganizations extends Organization {
    constructor(orgName, caAdmin, caPassword, peerAdmin, peerPassword, channelName, portNumber) {
        super(orgName, caAdmin, caPassword, channelName, portNumber)
        this.peerAdmin = peerAdmin
        this.peerPassword = peerPassword
        this.peerPort = portNumber + 1
        this.peerOperationPort = `1${this.peerPort}`
        this.chainCodePort = this.peerPort + 1
    }
}

class OrdererOrganizations extends Organization {
    constructor(orgName, caAdmin, caPassword, ordererAdmin, ordererPassword, channelName, portNumber) {
        super(orgName, caAdmin, caPassword, channelName, portNumber)
        this.ordererAdmin = ordererAdmin
        this.ordererPassword = ordererPassword
        this.ordererPort = portNumber + 1
        this.ordererOperationPort = `1${this.ordererPort}`
        this.ordererAdminPort = this.ordererPort + 1 // use by onsadmin
    }
}

class Channel {
    constructor(channelName, orderer, peers) {
        this.channelName = channelName
        this.orderer = orderer
        this.peers = [] // it is a array
        this.peers = peers
    }

    set addPeer(peer) {
        this.peers.push(peer)
    }
}


exports.Organization = Organization
exports.PeerOrganization = PeerOrganizations
exports.OrdererOrganizations = OrdererOrganizations