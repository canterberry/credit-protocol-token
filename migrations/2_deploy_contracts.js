var Tiers = artifacts.require("./Tiers.sol");
var DPIcoWhitelist = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");

module.exports = function(deployer, network, accounts) {
    const october1st1600 = 1506873600;
    const november1st0000 = 1509494400;

    const twoDays = 2 * 24 * 60 * 60;
    const fiveDays = 5 * 24 * 60 * 60;
    const sevenDays = 7 * 24 * 60 * 60;
    const thirtyDays = 30 * 24 * 60 * 60;

    const owner = "0x8f561336199be656619dac5de38861df5b4cf01c";


    if (network == "mainnet") {
        var whitelistAddress = "0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602";

        const wallet = "0x010AE84C74D2Bd56801f245EA105d048C6e89B13";
        const airdropWallet = "0x3f3a8e196B58f0EB39F783D33b8dbdC95Aaa9eE1";
        const advisorWallet = "0x9eFf802e8df0864304Cd4bd9Ba53304b035dC4b7";
        const stakingWallet = "0xA9FD330AC656AbCAD60F0F6cAa2F69Dd90B26137";
        const privateSaleWallet = "0x7c380382B7e2c72BC1b642735389a096A8fE7c66";

        const startTime = october1st1600;
        const endTime   = november1st0000;
        const whitelistEndTime = new web3.BigNumber(startTime + fiveDays);
        const openWhitelistEndTime = new web3.BigNumber(startTime + sevenDays);
        //FIX PARAMS BELOW
     //   deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, openWhitelistEndTime, wallet, whitelistAddress, airdropWallet, advisorWallet, stakingWallet, privateSaleWallet);
    }


    else if (network == "mainnetTest") {
        var twhitelistAddress = "0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602";

        const twallet = "0xF617CC9DE7c4392D30dB54D7358719dd22C04eb8";
        const tairdropWallet = "0x47Eb2be0E24b3e8a69Ff118aAe6A6dFEE05D4e37";
        const tadvisorWallet = "0xDDD3CF3Ac1351D67214a50D2fbC889e5b860BC06";
        const tstakingWallet = "0x3184d822758787a7fa82B032B678000FAf81FA4C";
        const tprivateSaleWallet = "0x3bd170a319a1096dB90ba271B5266b79Eec6315b";

        const tstartTime = 1506602855; //SET THIS
        const tendTime   = new web3.BigNumber(tstartTime + 30*60); //30 mins
        const twhitelistEndTime = new web3.BigNumber(tstartTime + 10*60); //10 mins
        const topenWhitelistEndTime = new web3.BigNumber(tstartTime + 20*60); //20 mins
        //FIX PARAMS BELOW
        //deployer.deploy(CPCrowdsale, tstartTime, tendTime, twhitelistEndTime, topenWhitelistEndTime, twallet, twhitelistAddress, tairdropWallet, tadvisorWallet, tstakingWallet, tprivateSaleWallet, {gas: 4900000, gasPrice: 21000000000});
    }




    else if (network == "ropsten") {
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
        //FIX PARAMS BELOW
//        deployer.deploy(CPCrowdsale, ropstenStartTime, ropstenEndTime, ropstenWhitelistEndTime, ropstenOpenWhitelistEndTime, ropstenWallet, ropstenWhitelistAddress, ropstenAirdropWallet, ropstenAdvisorWallet, ropstenStakingWallet, ropstenPrivateSaleWallet, {gas: 6000000, gasPrice: 21000000000});
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
        const wallet = web3.eth.accounts[0]
        const deployDelay = 10000;
        var whitelist;
        var tiersContract;
        deployer.deploy(DPIcoWhitelist, {from: web3.eth.accounts[0]}).then(s => {
            console.log(s);
            return DPIcoWhitelist.deployed();
        }).then(whitelistContract => {
            whitelist = whitelistContract;
            return whitelist.setSignUpOnOff(true);
        }).then(() => {
            return whitelist.signUp({from: web3.eth.accounts[1]});
        }).then(() => {
            return deployer.deploy(Tiers, {from: web3.eth.accounts[0]});
        }).then(s => {
            console.log(s);
            return Tiers.deployed();
        }).then(tContract => {
            tiersContract = tContract;
            const result = web3.eth.getBlock("latest");
            const now = result.timestamp;
            const startTime = web3.toBigNumber(now + deployDelay);
            const endTime = web3.toBigNumber(now + thirtyDays);
            const whitelistEndTime = new web3.BigNumber(now + fiveDays);
            const openWhitelistEndTime = new web3.BigNumber(now + fiveDays + twoDays);
            return deployer.deploy(CPCrowdsale, startTime, endTime, whitelistEndTime, openWhitelistEndTime, wallet, tiersContract.address, whitelist.address, wallet, wallet, wallet, wallet, {from: web3.eth.accounts[0]});
          }).catch(function(e) {
              console.log(e);
          });
    }
};
