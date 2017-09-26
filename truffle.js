module.exports = {
  networks: {
    console: {
      host: "localhost",
      port: 8547,
      network_id: "*" // Match any network id
    },
    testrpc: {
      host: "localhost",
      port: 8546,
      network_id: "*" // Match any network id
    },
    geth: {
      host: "localhost",
      port: 8548,
      network_id: 58342
    },
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: 3
    },
    ropstenNoData: {
      host: "localhost",
      port: 8545,
      network_id: 3
    }
  }
};
