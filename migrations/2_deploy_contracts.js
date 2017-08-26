var DPW = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");

var ethToWei = function(ethAmountStr) {
    return new web3.BigNumber(ethAmountStr + "000000000000000000");
};

module.exports = function(deployer, network, accounts) {
    deployer.deploy(DPW);

    const startBlock = web3.eth.blockNumber + 2;
    const endBlock = startBlock + 300;
    const rate = new web3.BigNumber(1000);
    const wallet = web3.eth.accounts[0];
    const cap = web3.toWei(40000, "ether");
    deployer.deploy(CPCrowdsale, startBlock, endBlock, rate, wallet, cap);

};
