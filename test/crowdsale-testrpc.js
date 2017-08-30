var DPW = artifacts.require("./DPIcoWhitelist.sol");
var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var CPToken = artifacts.require("./CPToken.sol");

//DPW is deployed by the migration, so don't need to redo it
contract('CPCrowdsale', function(accounts) {

    var account1 = accounts[0];
    var account2 = accounts[1];
    var account3 = accounts[2];
    var account4 = accounts[3];
    var whitelist;
    var cpSale;
    var cpToken;

    const fiveDays = 5*24*60*60;
    const thirtyDays = 30*24*60*60;
    const wallet = account1;

    it("can only buy maxPurchase during whitelist period", function() {
        web3.eth.getBlock("latest", (error, result) => {
            var now = result.timestamp;
            var startTime = new web3.BigNumber(now - fiveDays);
            var endTime = new web3.BigNumber(now + thirtyDays);
            var whitelistEndTime = new web3.BigNumber(now + fiveDays);
            var rate = new web3.BigNumber(1000);
            var cap = web3.toWei(45000, "ether");
            var startingWeiRaised = web3.toWei(1296, "ether");

            var maxBuy;
            var numWhitelistUsers;
            CPCrowdsale.new(startTime, endTime, whitelistEndTime, rate, wallet, cap, DPW.address, startingWeiRaised).then(instance => {
                cpSale = instance;
                return cpSale.token();
            }).then(addr => {
                cpToken = CPToken.at(addr);
                return DPW.deployed();
            }).then(v => {
                whitelist = v;
                return whitelist.numUsers();
            }).then(v => {
                numWhitelistUsers = v.valueOf();
                return cpSale.maxWhitelistPurchaseWei.call();
            }).then(v => {
                maxBuy = v.valueOf();
                assert.equal(maxBuy, (cap-startingWeiRaised)/numWhitelistUsers, "Max whitelist purchase should be cap/numWhitelistUsers");
                return cpSale.buyTokens(account2, {from: account2, value: web3.toWei(1, "ether")});
                //        }).catch(error => {
  //          assert.equal(error.toString(), "Error: VM Exception while processing transaction: invalid opcode", "Shouldn't allow buy > maxBuy during whitelist period");
            });
        });
    });
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
