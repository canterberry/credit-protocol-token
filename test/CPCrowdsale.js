var h = require("./helpers/helpers");

const should = require('chai')
          .use(require('chai-as-promised'))
          .use(require('chai-bignumber')(h.BigNumber))
          .should();

const CPCrowdsale = artifacts.require('./helpers/CPCrowdsale.sol');
const CPToken = artifacts.require("./CPToken.sol");
const Whitelist = artifacts.require("./DPIcoWhitelist.sol");

const deciEth = new h.BigNumber(h.toWei(1, "ether") / 10);
const presaleEthersold = 18000
const presaleWeiSold = new h.BigNumber(h.toWei(presaleEthersold, "ether"));

contract('CPCrowdsale', function([owner, wallet, user1, user2, user3]) {
    const privateTokens = new h.BigNumber(116158667 - 33695200);

    before(async function() {
        // Advance to the next block to correctly read time in the solidity
        // "now" function interpreted by testrpc
        await h.advanceBlock();
    });

    beforeEach(async function() {
        this.startTime            = h.latestTime() + h.duration.weeks(1);
        this.endTime              = this.startTime + h.duration.weeks(4);
        this.whitelistEndTime     = this.startTime + h.duration.days(5);
        this.openWhitelistEndTime = this.startTime + h.duration.days(6);
        this.afterEndTime         = this.endTime   + h.duration.seconds(1);

        this.setTimeOpenWhitelistPeriod = async function() {
            await h.increaseTimeTo(this.whitelistEndTime + h.duration.hours(1));
        }

        this.setTimeNormalPeriod = async function() {
            await h.increaseTimeTo(this.openWhitelistEndTime + h.duration.hours(1));
        }

        this.whitelist = await Whitelist.new({from: owner});
        await this.whitelist.setSignUpOnOff(true, {from: owner});
        await this.whitelist.signUp({from: user1});
        await this.whitelist.signUp({from: user2});

        this.crowdsale = await CPCrowdsale.new(this.startTime, this.endTime, this.whitelistEndTime, this.openWhitelistEndTime, wallet, this.whitelist.address, {from: owner});
        this.token  = CPToken.at(await this.crowdsale.token());
        this.maxWhitelistBuy = h.roundToDecieth(new h.BigNumber((await this.crowdsale.maxWhitelistPurchaseWei()).valueOf()));
        this.roundedThirdMaxWhitelistBuy = h.roundToDecieth(this.maxWhitelistBuy.div(3));
        this.cap = new h.BigNumber((await this.crowdsale.cap()).valueOf());

    });

    describe("Before start", function() {
        it("rejects payment before start", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("mints the correct number of developer tokens", async function() {
            const balance = await this.token.balanceOf(wallet);
            balance.should.be.bignumber.equal(privateTokens);
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

        it("calculates whitelist max purchase correctly", async function() {
            const whitelistSize = new h.BigNumber((await this.whitelist.numUsers()).valueOf());
            const cap = new h.BigNumber((await this.crowdsale.cap()).valueOf());
            console.log((cap.sub(presaleWeiSold)).divToInt(whitelistSize));
            console.log(this.maxWhitelistBuy);
            this.maxWhitelistBuy.should.be.bignumber.equal((cap.sub(presaleWeiSold)).divToInt(whitelistSize));
        });

        it("does not allow non-beneficiary to do a whitelist buy", async function() {
            await this.crowdsale.buyTokens(user1, {from: user2, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("does not allow non-whitelisted user to do a whitelist buy", async function() {
            await this.crowdsale.buyTokens(user3, {from: user3, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("does not allow a buy over the max during whitelist period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.plus(1)}).should.be.rejectedWith(h.EVMThrow);
        });

        it("allows buy up to max during whitelist period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy}).should.be.fulfilled;
        });

        it("allows owner to pause buys", async function() {
            await this.crowdsale.pause({from: owner});
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy}).should.be.rejectedWith(h.EVMThrow);
        });

        it("does not allow double purchasing during the whitelist period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.rejectedWith(h.EVMThrow);
        });

        it('should forward funds to wallet', async function() {
            const pre = web3.eth.getBalance(wallet);
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy});
            const post = web3.eth.getBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(this.maxWhitelistBuy);
        });

        // it("allocates the correct number of tokens", async function() {
        //     await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy});
        //     const balance = await this.token.balanceOf(user1);
        //     balance.should.be.bignumber.equal(h.calculateTokens(tiers, presaleWeiSold, this.maxWhitelistBuy));
        // });
    });

    describe("Open Whitelist period", function() {
        beforeEach(async function() {
            await this.setTimeOpenWhitelistPeriod();
        });

        it("does not allow non-beneficiary to do a open whitelist buy", async function() {
            await this.crowdsale.buyTokens(user1, {from: user2, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("does not allow non-whitelisted user to do a open whitelist buy", async function() {
            await this.crowdsale.buyTokens(user3, {from: user3, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("allows a buy over the max during open whitelist period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.plus(deciEth)}).should.be.fulfilled;
        });

        it("allows double purchasing during the open whitelist period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
        });

        it('should forward funds to wallet', async function() {
            const pre = web3.eth.getBalance(wallet);
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy});
            const post = web3.eth.getBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(this.maxWhitelistBuy);
        });

        // it("allocates the correct number of tokens", async function() {
        //     await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy});
        //     const balance = await this.token.balanceOf(user1);
        //     balance.should.be.bignumber.equal(h.calculateTokens(tiers, presaleWeiSold, buySize));
        // });
    });

    describe("Normal buying period", function() {
        beforeEach(async function() {
            await this.setTimeNormalPeriod();
        });

        it("buy cap results in proper amount of tokens created", async function() {
            const weiRaised = new h.BigNumber((await this.crowdsale.weiRaised()).valueOf());
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.cap.sub(weiRaised)}).should.be.fulfilled;
            await this.token.endSale({from: owner}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
            const transferableTokens = await this.token.transferableTokens(user1, 0);
            transferableTokens.should.be.bignumber.greaterThan(0);

            const totalSupply = new h.BigNumber((await this.token.totalSupply()).valueOf());
            totalSupply.should.be.bignumber.equal(116158667);
        });


        it("allows buy over the max", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.plus(deciEth)}).should.be.fulfilled;
        });

        it("allows double purchasing", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.roundedThirdMaxWhitelistBuy}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.roundedThirdMaxWhitelistBuy}).should.be.fulfilled;
        });

        it("allows owner to pause buys", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy}).should.be.fulfilled;
            await this.crowdsale.pause({from: user1}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.pause({from: owner});
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.unpause({from: user1}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.unpause({from: owner});
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy}).should.be.fulfilled;
        });

        it("allows non-beneficiary to buy for beneficiary", async function() {
            await this.crowdsale.buyTokens(user1, {from: user2, value: h.e2Wei(1)}).should.be.fulfilled;
        });

        it("allows finalization of contract and release of tokens once cap is reached", async function() {
            const weiRaised = new h.BigNumber((await this.crowdsale.weiRaised()).valueOf());
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.cap .sub(weiRaised)}).should.be.fulfilled;
            await this.token.endSale({from: owner}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
            const transferableTokens = await this.token.transferableTokens(user1, 0);
            transferableTokens.should.be.bignumber.greaterThan(0);
        });

        it('should forward funds to wallet', async function() {
            const buySize = h.e2Wei(10000);
            const pre = web3.eth.getBalance(wallet);
            await this.crowdsale.buyTokens(user3, {from: user3, value: buySize});
            const post = web3.eth.getBalance(wallet);
            post.minus(pre).should.be.bignumber.equal(buySize);
        });

        it("allocates the correct number of tokens", async function() {
            const buySize = h.e2Wei(25000);
            const currTier = await this.crowdsale.currTier();
            await this.crowdsale.buyTokens(user3, {from: user3, value: buySize});
            const balance = await this.token.balanceOf(user3);
            balance.should.be.bignumber.equal(h.calculateTokens(tiers, presaleWeiSold, buySize));
        });
    });

    describe("End and finalization", function() {
        beforeEach(async function() {
            await h.increaseTimeTo(this.endTime + h.duration.hours(1));
        });

        it("rejects payments after end", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: 1}).should.be.rejectedWith(h.EVMThrow);
        });

        it("finalizes the contract", async function() {
            await this.crowdsale.finalize({from: user2}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
        });

        it("can't finalize twice", async function() {
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
            await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(h.EVMThrow);
        });

        // it("mints remaining Eth allocation amount of tokens to the devs", async function() {
        //     const pre = await this.token.balanceOf(wallet);
        //     const weiRaised = await this.crowdsale.weiRaised();
        //     const remainingWei = (new h.BigNumber(cap)).minus(weiRaised);
        //     const remainingTokens = h.calculateTokens(tiers, weiRaised, remainingWei);
        //     await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
        //     const post = await this.token.balanceOf(wallet);
        //     post.minus(pre).should.be.bignumber.equal(remainingTokens);
        // });
    });

    describe("Whitelist to normal period transition", function() {
        beforeEach(async function() {
            await h.increaseTimeTo(this.startTime);
        });

        it("can buy on whitelist, then buy in normal period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.setTimeNormalPeriod();
            await this.crowdsale.buyTokens(user1, {from: user1, value: h.e2Wei(1)}).should.be.fulfilled;
        });
        it("rejected on whitelist, can buy in normal period", async function() {
            await this.crowdsale.buyTokens(user3, {from: user3, value: this.maxWhitelistBuy.div(3)}).should.be.rejectedWith(h.EVMThrow);
            await this.setTimeNormalPeriod();
            await this.crowdsale.buyTokens(user3, {from: user3, value: h.e2Wei(1)}).should.be.fulfilled;
        });
        it("can't double buy whitelist, can double buy in normal period", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.maxWhitelistBuy.div(3)}).should.be.rejectedWith(h.EVMThrow);
            await this.setTimeNormalPeriod();
            await this.crowdsale.buyTokens(user1, {from: user1, value: h.e2Wei(1)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: h.e2Wei(3)}).should.be.fulfilled;
        });
        it("multiple users buy before and after whitelist", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.roundedThirdMaxWhitelistBuy}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: this.roundedThirdMaxWhitelistBuy}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.buyTokens(user2, {from: user1, value: this.roundedThirdMaxWhitelistBuy}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.buyTokens(user2, {from: user2, value: deciEth}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user2, {from: user2, value: deciEth}).should.be.rejectedWith(h.EVMThrow);
            await this.crowdsale.buyTokens(user3, {from: user3, value: this.roundedThirdMaxWhitelistBuy}).should.be.rejectedWith(h.EVMThrow);
            await this.setTimeNormalPeriod();
            await this.crowdsale.buyTokens(user2, {from: user1, value: h.e2Wei(1)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: h.e2Wei(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user1, {from: user1, value: h.e2Wei(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user3, {from: user3, value: h.e2Wei(3)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user3, {from: user1, value: h.e2Wei(500)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user2, {from: user2, value: h.e2Wei(800)}).should.be.fulfilled;
            await this.crowdsale.buyTokens(user3, {from: user1, value: this.cap}).should.be.rejectedWith(h.EVMThrow);
        });

    });
});

const tiers = [
    { amountCap: h.e2Wei(18000), rate: 200 },
    { amountCap: h.e2Wei(18000 + 5000),  rate: 150 },
    { amountCap: h.e2Wei(18000 + 10000), rate: 135 },
    { amountCap: h.e2Wei(18000 + 15000), rate: 125 },
    { amountCap: h.e2Wei(18000 + 21000), rate: 115 },
    { amountCap: h.e2Wei(18000 + 27000), rate: 105 },
];


const tierAmountCaps = function() {
    var tmp = [];
    for(var i = 0; i < tiers.length; i++) {
        tmp.push(tiers[i].amountCap);
    }
    return tmp;
};

const tierRates = function() {
    var tmp = [];
    for(var i = 0; i < tiers.length; i++) {
        tmp.push(tiers[i].rate);
    }
    return tmp;
};
