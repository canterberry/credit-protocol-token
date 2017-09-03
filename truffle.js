module.exports = {
  networks: {
    csWhitelist: {
      host: "localhost",
      port: 8546,
      network_id: "*" // Match any network id
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
