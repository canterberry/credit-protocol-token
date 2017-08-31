var DPW = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var CPToken = artifacts.require("./CPToken.sol");

var whitelistAddr = "0xff3202a78ca7041e76943727fedb30c0ebeae0b4";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function delay(ms) {
    await sleep(ms);
}

contract('CPCrowdsale', function(accounts) {

    var account1 = accounts[0];
    var account2 = accounts[1];
    var account3 = accounts[2];
    var account4 = accounts[3];
    var whitelist = DPW.at(whitelistAddr);
    var cpSale;
    var cpToken;
    const rate = new web3.BigNumber(1000);
    const cap = web3.toWei(45000, "ether");
    const startingWeiRaised = web3.toWei(1296, "ether");

    const oneHour = 60*60;
    const fiveDays = 5*24*60*60;
    const thirtyDays = 30*24*60*60;
    const wallet = account1;

    it("can buy up to maxPurchase during whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {
            var now = result.timestamp;
            var startTime = new web3.BigNumber(now + 2);
            var endTime = new web3.BigNumber(now + thirtyDays);
            var whitelistEndTime = new web3.BigNumber(now + fiveDays);
            var maxBuy;
            var numWhitelistUsers;
            CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, whitelistAddr, startingWeiRaised, {from: account1}).then(instance => {
                cpSale = instance;
                return cpSale.token();
            }).then(addr => {
                cpToken = CPToken.at(addr);
                return whitelist.numUsers();
            }).then(v => {
                numWhitelistUsers = v.valueOf();
                return cpSale.getNow.call();
            }).then(v => {
                console.log(now);
                console.log(v.valueOf());
                return cpSale.maxWhitelistPurchaseWei.call();
            }).then(v => {
                delay(2500);
                maxBuy = new web3.BigNumber(v.valueOf());
                assert.equal(maxBuy, (cap - startingWeiRaised)/numWhitelistUsers, "Max whitelist purchase should be cap/numWhitelistUsers");
//                return cpSale.buyTokens(account2, {from: account2, value: maxBuy,
//                                                   gasLimit: web3.toWei(1, "ether")});
            });
        });
    });

    /*
    it("can't buy over maxPurchase during whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {
            var now = result.timestamp;
            var startTime = new web3.BigNumber(now + 2);
            var endTime = new web3.BigNumber(now + thirtyDays);
            var whitelistEndTime = new web3.BigNumber(now + fiveDays);
            var maxBuy;
            CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, whitelistAddr, startingWeiRaised).then(instance => {
                cpSale = instance;
                return cpSale.maxWhitelistPurchaseWei.call();
            }).then(v => {
                maxBuy = new web3.BigNumber(v.valueOf());
                return cpSale.buyTokens(account2, {from: account2, value: maxBuy.plus(1)});
            }).then(v => {
                assert.equal(true, false, "Shouldn't be able to buy over maxPurchase");
            }).catch(error => {
                assert.equal(error.toString(), "Error: VM Exception while processing transaction: invalid opcode", "Shouldn't allow buy > maxBuy during whitelist period");
            });
        });
    });


    it("*can* buy over maxPurchase *after* whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {
            var now = result.timestamp;
            var startTime = new web3.BigNumber(now + 2);
            var endTime = new web3.BigNumber(now + thirtyDays);
            var whitelistEndTime = new web3.BigNumber(now + oneHour);
            var maxBuy;
            CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, whitelistAddr, startingWeiRaised).then(instance => {
                cpSale = instance;
                return cpSale.maxWhitelistPurchaseWei.call();
            }).then(v => {
                maxBuy = new web3.BigNumber(v.valueOf());
                return cpSale.buyTokens(account2, {from: account2, value: maxBuy.plus(1)});
            }).then(v => {
                assert.equal(true, true, "Shouldn't block purchase after whitelist");
            }).catch(error => {
                assert.notEqual(error.toString(), "Error: VM Exception while processing transaction: invalid opcode", "Should allow buy > maxBuy after whitelist period");
            });
        });
    });
        */

    /*
     next test: number of tokens created
     */

    /*
    it("changes the rate at each level of Eth", function() {
        var rate1 = new web3.BigNumber(2000);
        var rate2 = new web3.BigNumber(1500);
        var rate3 = new web3.BigNumber(1000);
        var level1 = web3.toWei(2, "ether");
        var level2 = web3.toWei(4, "ether");
        var level3 = web3.toWei(7, "ether");

        var startBlock = web3.eth.blockNumber + 2;
        var endBlock = startBlock + 1000;
        var cap = web3.toWei(10, "ether");

        return CPCrowdsale.new(startBlock, endBlock, rate1, wallet, cap).then(instance => {

//            ins = instance;
  //          return ins.token();
//        }).then(addr => {
//            cpToken = CPToken.at(addr);
        });
    });
     */
});
