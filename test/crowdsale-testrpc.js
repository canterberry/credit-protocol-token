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

    const startBlock = web3.eth.blockNumber + 2;
    const endBlock = startBlock + 1000;
    const rate = new web3.BigNumber(1000);
    const wallet = account1;

    it("allows eth up to the cap; can't go over cap", function() {
        var rate = new web3.BigNumber(1000);
        var cap = web3.toWei(10, "ether");

        return CPCrowdsale.new(startBlock, endBlock, rate, wallet, cap).then(instance => {
            ins = instance;
            return ins.token();
        }).then(v => {
            cpToken = CPToken.at(v);
            var tx = {from: account2, value: web3.toWei(5, "ether")};
            return ins.sendTransaction(tx);
        }).then(v => {
            return cpToken.balanceOf(account2);
        }).then(bal => {
            var balNoDec = web3.fromWei(bal.toString(10), "ether");
            assert.equal(balNoDec, (5*rate).toString(10), "balance should be 5 Eth * rate");
        });
        /*
        }).catch(function(error) {
            assert.equal(error, "Error: VM Exception while processing transaction: invalid opcode", "should have failed because sent eth");
        //    return ins.isSignedUp(account3);
        }).then(function(signedup) {
            assert.equal(signedup, false, "shouldn't be signed up");
            return ins.sendTransaction({from: account3, value: 0});
        }).then(function(tx) {
            return ins.isSignedUp(account3);
        }).then(function(signedup) {
            assert.equal(signedup, true, "should be signed up");
            assert(web3.eth.getBalance(ins.address).toNumber() == 0);
        })
*/
    });
});
