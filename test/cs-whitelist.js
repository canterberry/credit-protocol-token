/*
 notes:
*/

var Whitelist = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var CPToken = artifacts.require("./CPToken.sol");

var delay = function(millis) {
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate - date < millis);
};

var tiers = [
    { amountCap: 5000,  rate: 1500 },
    { amountCap: 10000, rate: 1350 },
    { amountCap: 20000, rate: 1250 },
    { amountCap: 30000, rate: 1150 },
    { amountCap: 40000, rate: 1100 },
    { amountCap: 45000, rate: 1050 },
];

var tokenAmount = function(startWei, ethAmt) {
    var totalEth = parseInt(web3.fromWei(startWei, "ether"));
    var amtLeft  = parseInt(ethAmt);
    var tokens   = 0;
    var capLeft;
    for (var i=0; i<tiers.length; i++) {
        capLeft = tiers[i].amountCap - totalEth;
        if (amtLeft <= capLeft) {
            tokens += tiers[i].rate * amtLeft;
            break;
        }
        tokens += tiers[i].rate * capLeft;
        totalEth += capLeft;
        amtLeft  -= capLeft;
    }
    return tokens;
};

var eBal = function(account) {
    return web3.fromWei(web3.eth.getBalance(account), "ether");
};
var tokenFromDec = function(balance) {
    return web3.fromWei(balance, "ether");
};
var tokenToDec = function(tokenAmt) {
    return web3.toWei(tokenAmt, "ether");
};

contract('CPCrowdsale', function(accounts) {
    var cpSale;
    var cpToken;
    var whitelist;
    var account1 = accounts[0];
    var account2 = accounts[1];
    var account3 = accounts[2];
    var account4 = accounts[3];

    const deployDelay = 2;
    const rate = new web3.BigNumber(1000);
    const cap = web3.toWei(45000, "ether");
    const startingWeiRaised = web3.toWei(1296, "ether");

    const oneHour = 60*60;
    const fiveDays = 5*24*60*60;
    const thirtyDays = 30*24*60*60;
    const wallet = account1;

    it("can buy up to maxPurchase during whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {

            var maxBuy;
            var numWhitelistUsers;
            Whitelist.deployed().then(instance => {
                whitelist = instance;
            }).then(v => {
                return CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, whitelist.address, startingWeiRaised, {from: account1});
            }).then(instance => {
                cpSale = instance;
                return cpSale.token();
            }).then(addr => {
                cpToken = CPToken.at(addr);
                return whitelist.numUsers();
            }).then(v => {
                numWhitelistUsers = v.valueOf();
                delay(deployDelay*1000 + 1000);
                return cpSale.maxWhitelistPurchaseWei.call();
            }).then(v => {
                maxBuy = new web3.BigNumber(v.valueOf());
                assert.equal(maxBuy, (cap - startingWeiRaised)/numWhitelistUsers, "Max whitelist purchase should be cap/numWhitelistUsers");
                return cpSale.buyTokens(account2, {from: account2, value: maxBuy});
            }).then(v => {
                return cpToken.balanceOf(account2);
            }).then(v => {
                var expectedTokens = tokenAmount(startingWeiRaised, web3.fromWei(maxBuy));
                assert.equal(expectedTokens, tokenFromDec(v.valueOf()), "User should have expected tokens from maxBuy");
            });
        });
    });

    it("can't buy over maxPurchase during whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {
            var now = result.timestamp;
            var startTime = new web3.BigNumber(now + deployDelay);
            var endTime = new web3.BigNumber(now + thirtyDays);
            var whitelistEndTime = new web3.BigNumber(now + fiveDays);
            var maxBuy;
            Whitelist.deployed().then(instance => {
                whitelist = instance;
            }).then(v => {
                return CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, whitelist.address, startingWeiRaised, {from: account1});
     }).then(instance => {
                cpSale = instance;
                return cpSale.maxWhitelistPurchaseWei.call();
            }).then(v => {
                maxBuy = new web3.BigNumber(v.valueOf());
                delay(deployDelay*1000 + 1000);
                return cpSale.buyTokens(account2, {from: account2, value: maxBuy.plus(1)});
            }).then(v => {
                assert.equal(true, false, "Shouldn't be able to buy over maxPurchase during whitelist period");
            }).catch(error => {
                assert.equal(error.toString(), "Error: VM Exception while processing transaction: invalid opcode", "Shouldn't allow buy > maxBuy during whitelist period");
            });
        });
    });

    /*
    it("*can* buy over maxPurchase *after* whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {
            var now = result.timestamp;
            var startTime = new web3.BigNumber(now + 2);
            var endTime = new web3.BigNumber(now + thirtyDays);
            var whitelistEndTime = new web3.BigNumber(now + oneHour);
            var maxBuy;
            Whitelist.deployed().then(instance => {
                whitelist = instance;
            }).then(v => {
            return CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, whitelist.address, startingWeiRaised, {from: account1});
     }).then(instance => {
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
});
