const axios = require('axios'),
    dayjs = require('dayjs')

const STATUS_UP = 'UP',
    STATUS_UNKNOWN = 'UNKNOWN',
    STATUS_INIT = 'INIT'

function Sweeper(consul, addresses) {
    this.consul = consul
    this.addresses = addresses
    this.timer = null
    this.SweepIntervalSec = 10
    this.isReady = false
    this.ValidAddresses = {}
    this.UsedAddresses = {}
    this.UnusedAddresses = []

    this.init()
}

Sweeper.prototype.init = function () {
    this.UsedAddresses = this.ValidAddresses = expandAddressRange(this.addresses)

}

Sweeper.prototype.sweep = async function () {
    console.log('Sweeping addressess...')
    await this.getConsulInfo()

    this.timer = setTimeout(() => {
        this.sweep()
    }, this.SweepIntervalSec * 1000);
}

Sweeper.prototype.getConsulInfo = async function() {
    return new Promise((resolve, reject) => {
        axios.get(this.consul.BaseUrl + '/v1/catalog/nodes')
            .then((resp) => {
                // console.log(resp.data)
                // duplicate UsedAddresses for triage if not listed in Consul
                let UsedAddressesCopy = Object.keys(this.UsedAddresses)
                // console.log(UsedAddressesCopy)
                // process.exit(0)

                resp.data.forEach(node => {
                    // validate address
                    if (!(node.Address in this.ValidAddresses)) {
                        console.log('WARNING: %s is not registered as a valid address', node.Address)
                    } else {
                        // valid: check if address is already in the used pile
                        if (!(node.Address in this.UsedAddresses)) {
                            // not in used pile: remove from unused pile
                            UnusedAddressesCopy.splice(UnusedAddressesCopy.indexOf(node.Address), 1)
                        }

                        if (!this.UsedAddresses[node.Address] || this.UsedAddresses[node.Address].status != STATUS_UP) {
                            console.log('CHANGED: Status = UP for %s', node.Address)
                            this.UsedAddresses[node.Address] = {
                                status: STATUS_UP
                            }
                        }

                        // remove from triage pile
                        UsedAddressesCopy.splice(UsedAddressesCopy.indexOf(node.Address), 1)
                    }
                })

                // triage addresses not listed in Consul
                UsedAddressesCopy.forEach((address) => {
                    if (this.UsedAddresses[address].status !== STATUS_UNKNOWN) {
                        console.log('CHANGED: Status = UNKNOWN for %s', address)
                        this.UsedAddresses[address].status = STATUS_UNKNOWN
                        this.UsedAddresses[address].DateTimeModified = dayjs()
                    }
                })

                this.isReady = true
                resolve()
            })
            .catch((err) => {
                reject(err)
            })
    })
}

function expandAddressRange(ranges) {
    let ret = {}

    Object.keys(ranges).forEach(key => {
        let range = ranges[key]
        let StartAddr = range.start.split('.')
        let EndAddr = range.end.split('.')
        let StartNum4 = parseInt(StartAddr.pop())
        let EndNum4 = parseInt(EndAddr.pop())
        let StartNum3 = parseInt(StartAddr.pop())
        let EndNum3 = parseInt(EndAddr.pop())

        for (let Num3 = StartNum3; Num3 <= EndNum3; Num3++) {
            let LoopStartNum = Num3 === StartNum3 ? StartNum4 : 1
            let LoopEndNum = Num3 === EndNum3 ? EndNum4 : 254
            for (let i = LoopStartNum; i <= LoopEndNum; i++) {
                let address = StartAddr.concat([Num3, i]).join('.')
                // console.log(address)
                ret[address] = {
                    status: STATUS_INIT
                }
            }
        }
    })
    return ret
}

module.exports = Sweeper