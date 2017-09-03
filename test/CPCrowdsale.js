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

contract('CPCrowdsale', function ([owner, wallet, other1, other2, other3]) {
    const rate = new BigNumber(1000); //rate not actually used, uses tiers
    const startingWeiRaised = toWei(1296, "ether");
    const cap = toWei(45000, "ether");

    before(async function() {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
    });

    beforeEach(async function () {
        this.startTime        = latestTime()   + duration.weeks(1);
        this.endTime          = this.startTime + duration.weeks(4);
        this.whitelistEndTime = this.startTime + duration.weeks(1);
        this.afterEndTime     = this.endTime   + duration.seconds(1);

        this.whitelist = await Whitelist.new({from: owner});
        await this.whitelist.setSignUpOnOff(true, {from: owner});
        await this.whitelist.signUp({from: other1});
        await this.whitelist.signUp({from: other2});
        await this.whitelist.signUp({from: other3});

        this.crowdsale = await CPCrowdsale.new(this.startTime, this.endTime, this.whitelistEndTime, rate, wallet, cap, this.whitelist.address, startingWeiRaised, {from: owner});
        this.token = CPToken.at(await this.crowdsale.token());
    });

    it("calculates whitelist max purchase correctly", async function() {
        whitelistSize = new BigNumber((await this.whitelist.numUsers()).valueOf());
        maxBuy = new BigNumber((await this.crowdsale.maxWhitelistPurchaseWei()).valueOf());
        maxBuy.should.be.bignumber.equal((cap - startingWeiRaised)/whitelistSize);
    });
});


/* helpers */
// Increases testrpc time by the passed duration in seconds
function increaseTime(duration) {
  const id = Date.now()

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
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
}

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
async function advanceToBlock(number) {
  if (web3.eth.blockNumber > number) {
      throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`);
  }

  while (web3.eth.blockNumber < number) {
      await advanceBlock();
  }
}

function latestTime() {
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
