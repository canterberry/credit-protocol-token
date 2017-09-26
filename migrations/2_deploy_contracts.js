var DPIcoWhitelist = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var TestSale = artifacts.require("./TestSale.sol");

module.exports = function(deployer, network) {
    const october1st1600 = 1506873600;
    const november1st0000 = 1509494400;

    const fiveDays = 5 * 24 * 60 * 60;
    const sevenDays = 7 * 24 * 60 * 60;
    const thirtyDays = 30 * 24 * 60 * 60;

    if (network == "ropsten") {
        const wallet = "";
        var whitelist = "0x25d48524424bea76d51eb2056ca83511a6e58ef7";
        const startTime = october1st1600;
        const endTime   = november1st0000;
        const whitelistEndTime = new web3.BigNumber(startTime + fiveDays);
        const openWhitelistEndTime = new web3.BigNumber(startTime + sevenDays);
    }

    else if (network == "mainnet") {
        var whitelistAddress = "0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602";
        const wallet = "";
        const advisorWallet = "";
        const airdropWallet = "";
        const stakingWallet = "";
        const privateSaleWallet = "";

        const startTime = october1st1600;
        const endTime   = november1st0000;
        const whitelistEndTime = new web3.BigNumber(startTime + fiveDays);
        const openWhitelistEndTime = new web3.BigNumber(startTime + sevenDays);
        deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, openWhitelistEndTime, wallet, whitelistAddress, );
    }

    else if (network === "console") {
        const wallet = web3.eth.accounts[0];
        const deployDelay = 2;
        var whitelist;
        deployer.deploy(DPIcoWhitelist).then(function() {
                return DPIcoWhitelist.deployed();
        }).then(whitelistContract => {
            whitelist = whitelistContract;
            return whitelist.setSignUpOnOff(true);
        }).then(() => {
            whitelist.signUp({from: web3.eth.accounts[1]});
        }).then(() => {
            const result = web3.eth.getBlock("latest");
            const now = result.timestamp;
            const startTime = new web3.BigNumber(now + deployDelay);
            const endTime = new web3.BigNumber(now + thirtyDays);
            const whitelistEndTime = new web3.BigNumber(now + fiveDays);
            const openWhitelistEndTime = new web3.BigNumber(now + fiveDays + twoDays);
            return deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, openWhitelistEndTime, wallet, whitelist.address, wallet, wallet, wallet, wallet);
        }).then(() => {
            return CPCrowdsale.deployed();
        });
    } else if (network === "geth") {
        var whitelist;
        deployer.deploy(DPIcoWhitelist, {from: web3.eth.accounts[0]}).then(function() {
                return DPIcoWhitelist.deployed();
        })
        //     .then(whitelistContract => {
        //     whitelist = whitelistContract;
        //     return whitelist.setSignUpOnOff(true);
        // }).then(() => {
        //     whitelist.signUp({from: web3.eth.accounts[1]});
        // }).then(() => {
        //     const result = web3.eth.getBlock("latest");
        //     const now = result.timestamp;
        //     const startTime = new web3.BigNumber(now + deployDelay);
        //     const endTime = new web3.BigNumber(now + thirtyDays);
        //     const whitelistEndTime = new web3.BigNumber(now + fiveDays);
        //     const openWhitelistEndTime = new web3.BigNumber(now + fiveDays + twoDays);
        //     return deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, openWhitelistEndTime, wallet, whitelist.address, wallet, wallet, wallet, wallet);
        // }).then(() => {
        //     return CPCrowdsale.deployed();
        // });
    }
};
