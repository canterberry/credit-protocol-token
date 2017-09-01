pragma solidity ^0.4.13;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';

contract CPCrowdsale is CappedCrowdsale, FinalizableCrowdsale {
  using SafeMath for uint256;

  uint256 constant numDevTokens     = 10;
  uint256 constant numPresaleTokens = 10;

  uint256   public constant numTiers = 6;
  uint256[] public tierRates;
  uint256[] public tierAmountCaps;
  uint256   public currTier;

  AbstractWhitelist aw;
  mapping ( address => bool ) hasPurchased; //has whitelist address purchased already
  uint256 whitelistEndTime;
  uint256 public maxWhitelistPurchaseWei;

  function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, uint256 _rate, address _wallet, uint256 _cap, address _whitelistContract, uint256 _startingWeiRaised)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    aw = AbstractWhitelist(_whitelistContract);
    require ( aw.numUsers() > 0 );
    currTier = 0;
    whitelistEndTime = _whitelistEndTime;
    token.mint(_wallet, numDevTokens); //distribute agreed amount of tokens to devs
    initTiers();
    weiRaised = _startingWeiRaised;
    maxWhitelistPurchaseWei = (cap - weiRaised).div(aw.numUsers());
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

  function buyTokens(address beneficiary) payable {
    uint256 weiAmount = msg.value;

    require(beneficiary != 0x0);
    require(validPurchase());
    require(whitelistValidPurchase(beneficiary, weiAmount));
    //record that this address has purchased for whitelist purposes
    hasPurchased[beneficiary] = true;

    //setTier() and calculateTokens are safe to call because validPurchase checks
    //for the cap to be passed or not
    uint256 tokens = calculateTokens(weiAmount, weiRaised, currTier, 0);
    weiRaised = weiRaised.add(weiAmount);
    setTier(weiRaised);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();

  }

  function getNow() constant returns (uint256) {
    return now;
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

  /**
   * @dev Calculates how many tokens a given amount of wei can buy
   * Takes into account tiers of purchase bonus
   */
  function calculateTokens(uint256 _amountWei, uint256 _weiRaised, uint256 _tier, uint256 tokenAcc) constant returns (uint256) {
    uint256 currRate = tierRates[_tier];
    uint256 tierAmountLeftWei = tierAmountCaps[_tier] - _weiRaised;
    if ( _amountWei <= tierAmountLeftWei ) {
      return tokenAcc.add(_amountWei * currRate);
    }
    else {
      return calculateTokens(_amountWei.sub(tierAmountLeftWei), _weiRaised.add(tierAmountLeftWei), _tier.add(1), tokenAcc.add(tierAmountLeftWei * currRate));
    }
  }

  function setTier(uint256 _weiRaised) private {
    while( _weiRaised > tierAmountCaps[currTier] ) {
      currTier = currTier.add(1);
    }
  }

  /**
   * @dev Overriden to add finalization logic.
   * Mints remaining tokens to dev wallet
   */
  function finalization() internal {
    if ( cap <= weiRaised ) return;
    uint256 remainingWei = cap.sub(weiRaised);
    uint256 remainingDevTokens = calculateTokens(remainingWei, weiRaised, currTier, 0);
    token.mint(wallet, remainingDevTokens);
    super.finalization();
  }

}
