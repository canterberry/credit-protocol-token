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
        var ropstenWhitelistAddress = "0x25d48524424bea76d51eb2056ca83511a6e58ef7";
        //below are metamask accounts
        const ropstenWallet = "0x406Dd5315e6B63d6F1bAd0C4ab9Cd8EBA6Bb1bD2";
        const ropstenAirdropWallet = "0xE241c02E638ce0a1beFEC039FF4551B79F2Cf8D2";
        const ropstenAdvisorWallet = "0x6C48110d0F02814f5b27aB7dc9734d69494389f4";
        const ropstenStakingWallet = "0xacA6476054E2c57e8a1359F8a8c63Eb2B47De6B0";
        const ropstenPrivateSaleWallet = "0xB07cd7De89Fa764301b6cC5f41eCd1497b72a475";
        const ropstenStartTime = october1st1600;
        const ropstenEndTime   = november1st0000;
        const ropstenWhitelistEndTime = new web3.BigNumber(ropstenStartTime + fiveDays);
        const ropstenOpenWhitelistEndTime = new web3.BigNumber(ropstenStartTime + sevenDays);
        deployer.deploy(CPCrowdsale, ropstenStartTime, ropstenEndTime, ropstenWhitelistEndTime, ropstenOpenWhitelistEndTime, ropstenWallet, ropstenWhitelistAddress, ropstenAirdropWallet, ropstenAdvisorWallet, ropstenStakingWallet, ropstenPrivateSaleWallet);
    }

    else if (network == "mainnet") {
        var whitelistAddress = "0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602";
        const wallet = "";
        const airdropWallet = "";
        const advisorWallet = "";
        const stakingWallet = "";
        const privateSaleWallet = "";

        const startTime = october1st1600;
        const endTime   = november1st0000;
        const whitelistEndTime = new web3.BigNumber(startTime + fiveDays);
        const openWhitelistEndTime = new web3.BigNumber(startTime + sevenDays);
        deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, openWhitelistEndTime, wallet, whitelistAddress, airdropWallet, advisorWallet, stakingWallet, privateSaleWallet);
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
