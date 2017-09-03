/* import {advanceBlock} from './helpers/advanceToBlock';
import {increaseTimeTo, duration} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMThrow from './helpers/EVMThrow';
*/

const BigNumber = web3.BigNumber;
const toWei     = web3.toWei;
const fromWei   = web3.fromWei;

const should = require('chai')
          .use(require('chai-as-promised'))
          .use(require('chai-bignumber')(BigNumber))
          .should();

const CPCrowdsale = artifacts.require('./helpers/CPCrowdsale.sol');
const CPToken = artifacts.require("./CPToken.sol");
const Whitelist = artifacts.require("./DPIcoWhitelist.sol");

contract('CPCrowdsale', function([owner, wallet, other1, other2, other3]) {
    const rate = new BigNumber(1000); //rate not actually used, uses tiers
    const startingWeiRaised = toWei(1296, "ether");
    const cap = toWei(45000, "ether");

    before(async function() {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });

    beforeEach(async function() {
        this.startTime        = latestTime()   + duration.weeks(1);
        this.endTime          = this.startTime + duration.weeks(4);
        this.whitelistEndTime = this.startTime + duration.weeks(1);
        this.afterEndTime     = this.endTime   + duration.seconds(1);

        this.whitelist = await Whitelist.new({from: owner});
        await this.whitelist.setSignUpOnOff(true, {from: owner});
        await this.whitelist.signUp({from: other1});
        await this.whitelist.signUp({from: other2});

        this.crowdsale = await CPCrowdsale.new(this.startTime, this.endTime, this.whitelistEndTime, rate, wallet, cap, this.whitelist.address, startingWeiRaised, {from: owner});
        this.token  = CPToken.at(await this.crowdsale.token());
        this.maxWhitelistBuy = new BigNumber((await this.crowdsale.maxWhitelistPurchaseWei()).valueOf());
    });

    describe("Before contract starts", function() {
        it("rejects payment before start", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: 1}).should.be.rejectedWith(EVMThrow);
        });
    });

    describe("Whitelist period", function() {
        beforeEach(async function() {
            await increaseTimeTo(this.startTime);
        });

        it("calculates whitelist max purchase correctly", async function() {
            whitelistSize = new BigNumber((await this.whitelist.numUsers()).valueOf());
            this.maxWhitelistBuy.should.be.bignumber.equal((cap - startingWeiRaised)/whitelistSize);
        });

        it("does not allow non-beneficiary to do a whitelist buy", async function() {
            await this.crowdsale.buyTokens(other1, {from: other2, value: 1}).should.be.rejectedWith(EVMThrow);
        });

        it("does not allow non-whitelisted user to do a whitelist buy", async function() {
            await this.crowdsale.buyTokens(other3, {from: other3, value: 1}).should.be.rejectedWith(EVMThrow);
        });

        it("does not allow a buy over the max during whitelist period", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.plus(1)}).should.be.rejectedWith(EVMThrow);
        });

        it("allows buy up to max during whitelist period", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy}).should.be.fulfilled;
        });

        it("does not allow double purchasing during the whitelist period", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.rejectedWith(EVMThrow);
        });

        it('should forward funds to wallet', async function() {
            const pre = web3.eth.getBalance(wallet);
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy});
            const post = web3.eth.getBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(this.maxWhitelistBuy);
        });

        it("allocates the correct number of tokens", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy});
            const balance = await this.token.balanceOf(other1);
            balance.should.be.bignumber.equal(tokenToDec(expectedTokens(startingWeiRaised, fromWei(this.maxWhitelistBuy, "ether"))));
        });
    });

    describe("Normal buying period", function() {
        beforeEach(async function() {
            await increaseTimeTo(this.whitelistEndTime + duration.hours(1));
        });

        it("allows buy over the max", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.plus(1)}).should.be.fulfilled;
        });

        it("allows double purchasing", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
        });

        it("allows non-beneficiary to buy for beneficiary", async function() {
            await this.crowdsale.buyTokens(other1, {from: other2, value: e2Wei(1)}).should.be.fulfilled;
        });

        it('should forward funds to wallet', async function() {
            const buySize = e2Wei(10000);
            const pre = web3.eth.getBalance(wallet);
            await this.crowdsale.buyTokens(other3, {from: other3, value: buySize});
            const post = web3.eth.getBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(buySize);
        });

        /*
        it("calculates token allocation correctly", async function() {
            (3).should.be.equal(2);
        });

        it("allocates the correct number of tokens", async function() {
            (3).should.be.equal(2);
        });
         */
    });
});


/* helpers */
// Increases testrpc time by the passed duration in seconds
var increaseTime = function(duration) {
    const id = Date.now();

    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1)

            web3.currentProvider.sendAsync({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id+1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res);
            });
        });
    });
};

/**
 * Beware that due to the need of calling two separate testrpc methods and rpc calls overhead
 * it's hard to increase time precisely to a target point so design your test to tolerate
 * small fluctuations from time to time.
 *
 * @param target time in seconds
 */
function increaseTimeTo(target) {
  let now = latestTime();
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff);
}

const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
};

const EVMThrow = 'invalid opcode';

var advanceBlock = function() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now()
    }, (err, res) => {
        return err ? reject(err) : resolve(res);
    });
  });
};

// Advances the block number so that the last mined block is `number`.
var advanceToBlock = async function(number) {
  if (web3.eth.blockNumber > number) {
      throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`);
  }

  while (web3.eth.blockNumber < number) {
      await advanceBlock();
  }
};

var latestTime = function() {
  return web3.eth.getBlock('latest').timestamp;
}

var e2Wei = function(n) {
    return new web3.BigNumber(web3.toWei(n, 'ether'));
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

var tiers = [
    { amountCap: 5000,  rate: 1500 },
    { amountCap: 10000, rate: 1350 },
    { amountCap: 20000, rate: 1250 },
    { amountCap: 30000, rate: 1150 },
    { amountCap: 40000, rate: 1100 },
    { amountCap: 45000, rate: 1050 },
];

var expectedTokens = function(startWei, ethAmt) {
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
