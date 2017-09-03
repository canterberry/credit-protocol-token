/* import {advanceBlock} from './helpers/advanceToBlock';
import {increaseTimeTo, duration} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMThrow from './helpers/EVMThrow';
 */
var h = require("./helpers/helpers");

const should = require('chai')
          .use(require('chai-as-promised'))
          .use(require('chai-bignumber')(h.BigNumber))
          .should();

const CPCrowdsale = artifacts.require('./helpers/CPCrowdsale.sol');
const CPToken = artifacts.require("./CPToken.sol");
const Whitelist = artifacts.require("./DPIcoWhitelist.sol");

contract('CPCrowdsale', function([owner, wallet, other1, other2, other3]) {
    const numDevTokensNoDec     = new h.BigNumber(10000000); //10M
    const startingWeiRaised = h.toWei(1296, "ether");
    const cap = h.toWei(45000, "ether");

    before(async function() {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await h.advanceBlock();
    });

    beforeEach(async function() {
        this.startTime        = h.latestTime()   + h.duration.weeks(1);
        this.endTime          = this.startTime + h.duration.weeks(4);
        this.whitelistEndTime = this.startTime + h.duration.weeks(1);
        this.afterEndTime     = this.endTime   + h.duration.seconds(1);

        this.whitelist = await Whitelist.new({from: owner});
        await this.whitelist.setSignUpOnOff(true, {from: owner});
        await this.whitelist.signUp({from: other1});
        await this.whitelist.signUp({from: other2});

        this.crowdsale = await CPCrowdsale.new(this.startTime, this.endTime, this.whitelistEndTime, wallet, cap, tierRates(), tierAmountCaps(), this.whitelist.address, startingWeiRaised, numDevTokensNoDec, {from: owner});
        this.token  = CPToken.at(await this.crowdsale.token());
        this.maxWhitelistBuy = new h.BigNumber((await this.crowdsale.maxWhitelistPurchaseWei()).valueOf());
    });

    describe("Before contract starts", function() {
        it("rejects payment before start", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("non-owner can't pre-mint", async function() {
            await this.crowdsale.preMint(wallet, 1, {from: wallet}).should.be.rejectedWith(h.EVMThrow);
        });

        it("owner can pre-mint", async function() {
            var amt1 = new h.BigNumber(5006001);
            await this.crowdsale.preMint(wallet, amt1, {from: owner}).should.be.fulfilled;
        });

        it("pre-mint increases totalSupply correctly", async function() {
            var amt1 = new h.BigNumber     (1);
            var amt2 = new h.BigNumber (50000);
            var amt3 = new h.BigNumber(910090);
            await this.crowdsale.preMint(other1, amt1, {from: owner}).should.be.fulfilled;
            await this.crowdsale.preMint(other1, amt2, {from: owner}).should.be.fulfilled;
            await this.crowdsale.preMint(other2, amt3, {from: owner}).should.be.fulfilled;
            var supply = await this.token.totalSupply();
            supply.should.be.bignumber.equal(h.tokenToDec(amt1.plus(amt2).plus(amt3)).plus(h.tokenToDec(numDevTokensNoDec)));
        });

        it("mints the correct number of developer tokens", async function() {
            var balance = await this.token.balanceOf(wallet);
            balance.should.be.bignumber.equal(h.tokenToDec(numDevTokensNoDec));
        });

        it("sets the tiers correctly", async function() {
            for (var i=0; i < tiers.length; i++) {
                var c = new h.BigNumber((await this.crowdsale.tierAmountCaps(i)).valueOf());
                var r = new h.BigNumber((await this.crowdsale.tierRates(i)).valueOf());
                tiers[i].amountCap.should.be.bignumber.equal(c);
                tiers[i].rate.should.be.bignumber.equal(r);
            }
        });
    });

    describe("Whitelist period", function() {
        beforeEach(async function() {
            await h.increaseTimeTo(this.startTime);
        });

        it("owner can't pre-mint after start", async function() {
            await this.crowdsale.preMint(wallet, 1, {from: owner}).should.be.rejectedWith(h.EVMThrow);
        });

        it("calculates whitelist max purchase correctly", async function() {
            whitelistSize = new h.BigNumber((await this.whitelist.numUsers()).valueOf());
            this.maxWhitelistBuy.should.be.bignumber.equal((cap - startingWeiRaised)/whitelistSize);
        });

        it("does not allow non-beneficiary to do a whitelist buy", async function() {
            await this.crowdsale.buyTokens(other1, {from: other2, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("does not allow non-whitelisted user to do a whitelist buy", async function() {
            await this.crowdsale.buyTokens(other3, {from: other3, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("does not allow a buy over the max during whitelist period", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.plus(1)}).should.be.rejectedWith(h.EVMThrow);
        });

        it("allows buy up to max during whitelist period", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy}).should.be.fulfilled;
        });

        it("does not allow double purchasing during the whitelist period", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.rejectedWith(h.EVMThrow);
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
            balance.should.be.bignumber.equal(h.calculateTokens(tiers, startingWeiRaised, this.maxWhitelistBuy));
        });
    });

    describe("Normal buying period", function() {
        beforeEach(async function() {
            await h.increaseTimeTo(this.whitelistEndTime + h.duration.hours(1));
        });

        it("allows buy over the max", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.plus(1)}).should.be.fulfilled;
        });

        it("allows double purchasing", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(other1, {from: other1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
        });

        it("allows non-beneficiary to buy for beneficiary", async function() {
            await this.crowdsale.buyTokens(other1, {from: other2, value: h.e2Wei(1)}).should.be.fulfilled;
        });

        it('should forward funds to wallet', async function() {
            const buySize = h.e2Wei(10000);
            const pre = web3.eth.getBalance(wallet);
            await this.crowdsale.buyTokens(other3, {from: other3, value: buySize});
            const post = web3.eth.getBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(buySize);
        });

        it("allocates the correct number of tokens", async function() {
            const buySize = h.e2Wei(25000);
            const currTier = await this.crowdsale.currTier();
            await this.crowdsale.buyTokens(other3, {from: other3, value: buySize});
            const balance = await this.token.balanceOf(other3);
            balance.should.be.bignumber.equal(h.calculateTokens(tiers, startingWeiRaised, buySize));
        });
    });

    describe("End and finalization", function() {
        beforeEach(async function() {
            await h.increaseTimeTo(this.endTime + h.duration.hours(1));
        });

        it("rejects payments after end", async function() {
            await this.crowdsale.buyTokens(other1, {from: other1, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("finalizes the contract", async function() {
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
        });

        it("can't finalize twice", async function() {
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
            await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(h.EVMThrow);
        });

        it("mints remaining Eth allocation amount of tokens to the devs", async function() {
            const pre = await this.token.balanceOf(wallet);
            const weiRaised = await this.crowdsale.weiRaised();
            var c = new h.BigNumber(cap);
            const remainingWei = c.minus(weiRaised);
            const remainingTokens = h.calculateTokens(tiers, weiRaised, remainingWei);
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
            const post = await this.token.balanceOf(wallet);
            post.minus(pre).should.be.bignumber.equal(remainingTokens);
        });
    });
});

//TODO: do finalization


const tiers = [
    { amountCap: h.e2Wei(5000),  rate: 1500 },
    { amountCap: h.e2Wei(10000), rate: 1350 },
    { amountCap: h.e2Wei(20000), rate: 1250 },
    { amountCap: h.e2Wei(30000), rate: 1150 },
    { amountCap: h.e2Wei(40000), rate: 1100 },
    { amountCap: h.e2Wei(45000), rate: 1050 },
];

const tierAmountCaps = function() {
    var tmp = [];
    for(var i=0; i<tiers.length; i++) {
        tmp.push(tiers[i].amountCap);
    }
    return tmp;
};

const tierRates = function() {
    var tmp = [];
    for(var i=0; i<tiers.length; i++) {
        tmp.push(tiers[i].rate);
    }
    return tmp;
};
