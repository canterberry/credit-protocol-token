var CPCrowdsale = artifacts.require("./CPCrowdsale.sol");
var CPToken = artifacts.require("./CPToken.sol");

contract('CPCrowdsale', function(accounts) {

    var account1 = accounts[0];
    var account2 = accounts[1];
    var account3 = accounts[2];
    var account4 = accounts[3];
    var account5 = accounts[4];
    var account6 = accounts[5];
    var account7 = accounts[6];
    var ins;
    var cpToken;

    const wallet = account1;

    it("allows eth up to the cap; can't go over cap", function() {
        var startBlock = web3.eth.blockNumber + 2;
        var endBlock = startBlock + 1000;
        var rate = new web3.BigNumber(1000);
        var cap = web3.toWei(10, "ether");

        return CPCrowdsale.new(startBlock, endBlock, rate, wallet, cap).then(instance => {
            ins = instance;
            return ins.token();
        }).then(addr => {
            cpToken = CPToken.at(addr);
            var tx = {from: account2, value: web3.toWei(5, "ether")};
            return ins.sendTransaction(tx);
        }).then(v => {
            return cpToken.balanceOf(account2);
        }).then(bal => {
            var balNoDec = web3.fromWei(bal.toString(10), "ether");
            assert.equal(balNoDec, (5*rate).toString(10), "balance should be 5 Eth * rate");
            tx = {from: account2, value: web3.toWei(6, "ether")};
            return ins.sendTransaction(tx);
        }).catch(error => {
            assert.equal(error, "Error: VM Exception while processing transaction: invalid opcode", "should have failed: Eth sent over cap");
        });
    });

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
});
