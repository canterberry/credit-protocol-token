pragma solidity ^0.4.13;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';

contract CPCrowdsale is CappedCrowdsale {
  using SafeMath for uint256;

  uint256[] public tierRates;
  uint256[] public tierAmountCaps;
  uint256 public currTier = 0;

  AbstractWhitelist aw;
  mapping ( address => bool ) hasPurchased; //has whitelist address purchased already
  uint256 whitelistEndTime;
  uint256 maxWeiPurchase;

  function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint _cap, uint256 _whitelistEndTime, address whitelistContract, uint numDevTokens)
    CappedCrowdsale(_cap)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    aw = AbstractWhitelist(whitelistContract);
    maxWeiPurchase = (_cap * (1 ether)).div(aw.numUsers());
    whitelistEndTime = _whitelistEndTime;
    token.mint(_wallet, numDevTokens); //distribute agreed amount of tokens to devs
    initTiers();
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }

  function initTiers() {
    tierAmountCaps.push(5000 ether);
    tierRates.push(1500);
    tierAmountCaps.push(10000 ether);
    tierRates.push(1350);
    tierAmountCaps.push(20000 ether);
    tierRates.push(1250);
    tierAmountCaps.push(30000 ether);
    tierRates.push(1150);
    tierAmountCaps.push(40000 ether);
    tierRates.push(1100);
    tierAmountCaps.push(45000 ether);
    tierRates.push(1050);
  }

  function buyTokens(address beneficiary) payable {
    uint256 weiAmount = msg.value;

    require( cpValidPurchase(weiAmount) );
    require(beneficiary != 0x0);

    //record that this address has purchased for whitelist purposes
    hasPurchased[beneficiary] = true;

    // calculate token amount to be created
    //    uint256 tokens = weiAmount.mul(rate);
    uint256 tokens = calculateTokens(weiAmount);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
    //set the tier to the next level here based on weiRaised
    //setTier(weiRaised);
  }

  //can't override because need to pass value
  function cpValidPurchase(uint256 amountWei) constant returns (bool) {
    bool valid = false;
    //to check:
    /*
      -is whitelist period
      -hasPurchased (if whitelist)
      require( aw.isSignedUp(beneficiary) );
     */
    return valid && validPurchase();
  }

  function isWhitelistPeriod() constant returns (bool) {
    return ( now <= whitelistEndTime );
  }

  function calculateTokens(uint256 amountWei) constant returns (uint256) {
    uint256 tmpTokens = 0;
    uint256 tmpAmountWei = amountWei;
    uint256 tmpCurrTier = currTier;
    uint256 tmpWeiRaised = weiRaised;
    uint256 tierAmountLeft = 0;
    while (tmpAmountWei > 0) {
      tierAmountLeft = tierAmountCaps[currTier] - tmpWeiRaised;
      if ( tierAmountLeft >= tmpAmountWei ) {
        tmpTokens = tmpTokens.add(tierRates[currTier].mul(tmpAmountWei));
        tmpAmountWei = 0;
      }
      //if there are more tiers left to fill with this purchase
      else {
        tmpTokens = tmpTokens.add(tierRates[currTier].mul(tierAmountLeft));
        tmpAmountWei = tmpAmountWei.sub(tierAmountLeft);
        tmpCurrTier = tmpCurrTier.add(1);
        tmpWeiRaised = tmpWeiRaised.add(tierAmountLeft);
      }
    }
    return tmpTokens;
  }

  function setTier(uint256 _weiRaised) private {
    while( _weiRaised > tierAmountCaps[currTier] ) {
      currTier = currTier.add(1);
    }
  }
}

/* todo:

maxEth per purchase for whitelist = _cap/numUsers()


1. Mint tokens to devs
2. Mint tokens to pre-buyers
3. Start a whitelist period
4. End the whitelist period after 5 days
5. See how much Eth is left to sell
6. Sell for 25 days or until all tokens sold
7. Mint tokens up to the amount of Eth remaining, and give to devs at the end


if (weiRaised + purchaseAmountWei) > tierAmount[currTier]

while (amountToSpend > 0)
add amount spent up to tier
amountToSpend = amountToSpend - (tierAmount[currTier] - weiRaised)
increment tier

tierAmount - (weiRaised + purchaseAmountWei)

 */
