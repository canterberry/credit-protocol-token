var DPW = artifacts.require("./DPIcoWhitelist.sol");

contract('DPIcoWhitelist', function(accounts) {

    var account1 = accounts[0];
    var account2 = accounts[1];
    var account3 = accounts[2];
    var account4 = accounts[3];
    var account5 = accounts[4];
    var account6 = accounts[5];
    var account7 = accounts[6];
    var ins;


    it("turn whitelist on and take signups", function() {
        return DPW.new({from: account1}).then(function(instance) {
            ins = instance;
            return ins.signUpOn();
        }).then(function(v) {
            assert.equal(v.valueOf(), false, "whitelist signup should be off");
            return ins.setSignUpOnOff(true, {from: account1});
        }).then(function(tx) {
            return ins.signUp({from: account2});
        }).then(function(tx) {
            return ins.signUp({from: account3});
        }).then(function(tx) {
            return ins.signUp({from: account4});
        }).then(function(tx) {
            return ins.setSignUpOnOff(false, {from: account1});
        }).then(function(tx) {
            return ins.signUpOn();
        }).then(function(v) {
            assert.equal(v.valueOf(), false, "whitelist signup should be off");
            return ins.numUsers();
        }).then(function(v) {
            assert.equal(v.valueOf(), 3, "should have 3 users");
            return ins.userAtIndex(2);
        }).then(function(v) {
            assert.equal(v.valueOf(), account4, "3rd user should be account4");
            return ins.isSignedUp(account3);
        }).then(function(v) {
            assert.equal(v.valueOf(), true, "account3 should be signed up");
        });

    });
});
