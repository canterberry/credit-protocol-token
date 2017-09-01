var DPW = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var TestSale = artifacts.require("./TestSale.sol");

module.exports = function(deployer, network, accounts) {
    const oneDay = 24*60*60;
    const fiveDays = 5*24*60*60;
    const thirtyDays = 30*24*60*60;
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
    });
};
