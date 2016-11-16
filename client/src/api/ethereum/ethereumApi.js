import Web3 from 'web3'
import Contract from './contract.js'
import _ from 'lodash'
import winston from 'winston'

function logDebug(err) {
    winston.log('debug', err)
}
function logError(err) {
    winston.log('error', err);
}

export default class EthereumClient {
    constructor(contractAddresses) {
        const web3 = this.web3 = new Web3();
        this.contractAddresses = contractAddresses;
        web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
        try {
            web3.eth.defaultAccount = web3.eth.coinbase
        } catch (e) {
            logError('Failed to connect to ethereum network');
        }
        this.file = new Contract('FileSharing', 'FileSharing', web3)
    }

    getFileContract() {
        return new Promise((resolve, reject) => {
            if (this.contractAddresses != null) {
                return resolve(this.file.getContract(this.contractAddresses.file))
            }
            reject()
        }).catch(err => {
            logError(err);
        })
    }

    addFileMetaData(hash, link, name) {
        return new Promise((resolve, reject) => {
            this.getFileContract().then(contract => {
                contract.saveFile(hash, link, name, (error) => {
                    if (error) return reject(error);
                    return resolve()
                });
                // return contract.getLink.call(hash)
            })
        })
    }

    loadContracts() {
        return new Promise((resolve, reject) => {
            this.getFileContract().then((contract) => {
                return resolve(contract.address)
            })
        })
    }

    watchFileChanges(callback) {
        const web3 = this.web3;
        const filter = web3.eth.filter('latest');

        this.getFileContract().then((contract) => {
            contract.allEvents().watch((error, result) => {
                if (error) {
                    logError('Error', error);
                    return
                }

                const url = result.args._link;
                const hash = result.args._hash;
                return callback({url, hash})
            })
        }).catch(err => {
            logError(err);
            Promise.reject(err)
        })
    }

    addAPeer(hash, link) {
        return new Promise((resolve, reject) => {
            logDebug('addAPeer');
            this.getFileContract().then((contract) => {
                contract.addPeer.sendTransaction(hash, link, (error) => {
                    if (error) return reject(error);
                    return resolve()
                })
            }).catch(err => {
                logError(err);
                Promise.reject(err)
            })
        })
    }

    getPeer(hash) {
        return new Promise((resolve, reject) => {
            logDebug('getPeer');
            this.getFileContract().then((contract) => {
                return resolve(contract.getPeers.call(hash)[1])
            }).catch(err => {
                logError(err);
                reject(err)
            })
        })
    }

    getUserFilesHashes() {
        return new Promise((resolve, reject) => {
            this.getFileContract()
                .then((contract) => {
                    const fileCount = +contract.getUserFileCount.call();

                    if (!fileCount) return resolve([]);

                    const hashes = _.times(fileCount, i => {
                        return contract.getUserFile.call(i);
                    }).map(result => {
                        return result
                    });

                    return resolve(hashes)
                }).catch(err => {
                    logError(err);
                    reject(err)
                })
        })
    }

    findFileMetaDataFromEthChain(fileHash) {
        return new Promise((resolve, reject) => {
            this.getFileContract().then((contract) => {
                const result = contract.getFileByHash.call(fileHash);
                return resolve({link: result[0], name: result[1]})
            }).catch(err => {
                logError(err);
                Promise.reject(err)
            })
        })

    }
}
