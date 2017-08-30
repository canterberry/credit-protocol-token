var DPW = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var TestSale = artifacts.require("./TestSale.sol");

module.exports = function(deployer, network, accounts) {
    const oneDay = 24*60*60;
    const fiveDays = 5*24*60*60;
    const thirtyDays = 30*24*60*60;
    web3.eth.getBlock("latest", (error, result) => {
        var now = result.timestamp;

        const startTime = new web3.BigNumber(now + oneDay);
        const endTime = new web3.BigNumber(now + thirtyDays);
        const whitelistEndTime = new web3.BigNumber(now + fiveDays);
        const rate = new web3.BigNumber(1000);
        const wallet = web3.eth.accounts[0];
        const startingWeiRaised = web3.toWei(1296, "ether");
        const cap = web3.toWei(45000, "ether");
        var whitelist;

        deployer.deploy(DPW, {from: web3.eth.accounts[0]}).then(function() {
            return DPW.deployed();
        }).then(dpInst => {
            whitelist = dpInst;
            return whitelist.setSignUpOnOff(true, {from: web3.eth.accounts[0]});
        }).then(v => {
            return whitelist.signUp({from: web3.eth.accounts[1]});
        }).then(v => {
            return whitelist.signUp({from: web3.eth.accounts[2]});
        }).then(v => {
            return whitelist.signUp({from: web3.eth.accounts[3]});
        }).then(v => {
        //    return deployer.deploy(TestSale, startTime, endTime, rate, wallet, cap);
            return deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, rate, wallet, cap, DPW.address, startingWeiRaised, {from: web3.eth.accounts[0]});
        }).catch(err => {
            console.log("got an error");
            console.log(err);
        });
    });
};
