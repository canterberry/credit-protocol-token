pragma solidity ^0.4.13;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';

contract CPCrowdsale is CappedCrowdsale {
  using SafeMath for uint256;

  uint256 constant numDevTokens     = 10;
  uint256 constant numPresaleTokens = 10;

  uint256[] public tierRates;
  uint256[] public tierAmountCaps;
  uint256   public currTier;

  AbstractWhitelist aw;
  mapping ( address => bool ) hasPurchased; //has whitelist address purchased already
  uint256 whitelistEndTime;
  uint256 maxWhitelistPurchaseWei;

  function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, uint256 _rate, address _wallet, uint256 _cap, address _whitelistContract)
    CappedCrowdsale(_cap)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    aw = AbstractWhitelist(_whitelistContract);
    require ( aw.numUsers() > 0 );
    currTier = 0;

    //    maxWhitelistPurchaseWei = (_cap * (1 ether)).div(aw.numUsers());
    //    whitelistEndTime = _whitelistEndTime;
    //    token.mint(_wallet, numDevTokens); //distribute agreed amount of tokens to devs
//initTiers();
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }

  //this is a bit dirty and hard-coded, but that's safer in this case
  function initTiers() {
    require ( (45000 ether) == cap );
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

  /*
  function buyTokens(address beneficiary) payable {
    uint256 weiAmount = msg.value;

    require(beneficiary != 0x0);
    require(validPurchase());
    require(whitelistValidPurchase(beneficiary, weiAmount));

    //record that this address has purchased for whitelist purposes
    hasPurchased[beneficiary] = true;

    //setTier() and calculateTokens are safe to call because validPurchase checks
    //for the cap to be passed or not
    uint256 tokens = calculateTokens(weiAmount);
    weiRaised = weiRaised.add(weiAmount);
    setTier(weiRaised);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  //can't override because need to pass value
  function whitelistValidPurchase(address beneficiary, uint256 amountWei) constant returns (bool) {
    if ( isWhitelistPeriod() ) {
      if ( hasPurchased[beneficiary] )           return false;
      if ( !aw.isSignedUp(beneficiary) )         return false;
      if ( amountWei > maxWhitelistPurchaseWei ) return false;
    }
    return true;
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
  */
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
