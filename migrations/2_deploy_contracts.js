var DPW = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(DPW).then(function() {
        const fiveDays = 5*24*60*60;
        const thirtyDays = 30*24*60*60;

        const startTime = 0;
        const endTime = startTime + thirtyDays;
        const whitelistEndTime = startTime + fiveDays;
        const rate = new web3.BigNumber(1000);
        const wallet = web3.eth.accounts[0];
        const cap = web3.toWei(45000, "ether");
        return deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, rate, wallet, cap, DPW.address);
    });

};
