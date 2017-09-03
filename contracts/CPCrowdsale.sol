pragma solidity ^0.4.13;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';

contract CPCrowdsale is CappedCrowdsale, FinalizableCrowdsale {
  using SafeMath for uint256;

  uint256 public numDevTokensDec;

  uint256   public constant numTiers = 6;
  uint256[] public tierRates;
  uint256[] public tierAmountCaps;
  uint256   public currTier;

  AbstractWhitelist aw;
  mapping ( address => bool ) hasPurchased; //has whitelist address purchased already
  uint256 whitelistEndTime;
  uint256 public maxWhitelistPurchaseWei;

  function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, address _wallet, uint256 _cap, uint256[] _tierRates, uint256[] _tierAmountCaps, address _whitelistContract, uint256 _startingWeiRaised, uint256 _numDevTokensNoDec)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    Crowdsale(_startTime, _endTime, 1, _wallet)  //rate is a dummy value; we don't use it
  {
    //use an 18 decimal conversion
    numDevTokensDec = _numDevTokensNoDec * (10 ** 18);
    aw = AbstractWhitelist(_whitelistContract);
    require ( aw.numUsers() > 0 );
    currTier = 0;
    whitelistEndTime = _whitelistEndTime;
    token.mint(_wallet, numDevTokensDec); //distribute agreed amount of tokens to devs
    initTiers(_tierRates, _tierAmountCaps);
    weiRaised = _startingWeiRaised;
    maxWhitelistPurchaseWei = (cap - weiRaised).div(aw.numUsers());
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }

  function initTiers(uint256[] _tierRates, uint256[] _tierAmountCaps) {
    uint256 highestAmount = _tierAmountCaps[_tierAmountCaps.length - 1];
    require ( highestAmount == cap );
    for ( uint i=0; i<_tierAmountCaps.length; i++) {
      tierRates.push(_tierRates[i]);
      tierAmountCaps.push(_tierAmountCaps[i]);
    }
  }

  function buyTokens(address beneficiary) payable {
    uint256 weiAmount = msg.value;

    require(beneficiary != 0x0);
    require(validPurchase());
    require(whitelistValidPurchase(msg.sender, beneficiary, weiAmount));

    if (isWhitelistPeriod()) hasPurchased[beneficiary] = true;

    //setTier() and calculateTokens are safe to call because validPurchase checks
    //for the cap to be passed or not
    uint256 tokens = calculateTokens(weiAmount, weiRaised, currTier, 0);
    weiRaised = weiRaised.add(weiAmount);
    setTier(weiRaised);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  //can't override because need to pass value
  function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei) constant returns (bool) {
    if ( isWhitelistPeriod() ) {
      if ( buyer != beneficiary )                return false;
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
   * Recursive, but depth is limited to the number of tiers, which is 6
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
