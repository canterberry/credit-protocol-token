pragma solidity 0.4.15;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract CPCrowdsale is CappedCrowdsale, FinalizableCrowdsale, Pausable {
  using SafeMath for uint256;

  bool public offlineSaleDone; // when true, owner can no longer pre-mint
  uint public maxPreTokensNoDec;
  uint public numOfflineTokensNoDec;

  uint256   public constant dummyRate = 1;
  uint256   public constant numTiers = 6;
  uint256[] public tierRates; // Tokens are purchased at a rate of 1050-1500
                              // per Eth, depending on purchase tier.
                              // tierRates[i] is the purchase rate of tier_i
  uint256[] public tierAmountCaps; // tierAmountCaps[i] defines upper boundry of tier_i
  uint256   public currTier;

  AbstractWhitelist private aw;
  mapping (address => bool) private hasPurchased; // has whitelist address purchased already
  uint256 public whitelistEndTime;
  uint256 public maxWhitelistPurchaseWei;
  uint256 public openWhitelistEndTime;

  function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, uint256 _openWhitelistEndTime, address _wallet, uint256 _cap, uint256[] _tierRates, uint256[] _tierAmountCaps, address _whitelistContract, uint256 _startingWeiSold, uint256 _numDevTokensNoDec, uint256 _maxOfflineTokensNoDec)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    Crowdsale(_startTime, _endTime, dummyRate, _wallet)  // rate is a dummy value; we use tiers instead
  {
    maxPreTokensNoDec = _numDevTokensNoDec.add(_maxOfflineTokensNoDec);
    numOfflineTokensNoDec = 0;
    offlineSale(_wallet, _numDevTokensNoDec);
    aw = AbstractWhitelist(_whitelistContract);
    require (aw.numUsers() > 0);
    currTier = 0;
    whitelistEndTime = _whitelistEndTime;
    openWhitelistEndTime = _openWhitelistEndTime;
    initTiers(_tierRates, _tierAmountCaps);
    weiRaised = _startingWeiSold;
    maxWhitelistPurchaseWei = (cap.sub(weiRaised)).div(aw.numUsers());
  }

  // Public functions

  function offlineSale(address beneficiary, uint256 _numTokensNoDec) public onlyOwner {
    uint256 totalOffline = numOfflineTokensNoDec.add(_numTokensNoDec);
    require (now < startTime); // only runs before start of sale
    require (!offlineSaleDone);
    require (totalOffline <= maxPreTokensNoDec);
    numOfflineTokensNoDec = totalOffline;
    token.mint(beneficiary, (_numTokensNoDec.mul(10 ** 18)));
  }

  function endOfflineSale() public onlyOwner {
    require (!offlineSaleDone);
    offlineSaleDone = true;
  }

  function buyTokens(address beneficiary) public payable {
    uint256 weiAmount = msg.value;

    require(beneficiary != 0x0);
    require(validPurchase());
    require(!isWhitelistPeriod()
         || whitelistValidPurchase(msg.sender, beneficiary, weiAmount));
    require(!isOpenWhitelistPeriod()
         || openWhitelistValidPurchase(msg.sender, beneficiary));

    hasPurchased[beneficiary] = true;

    uint256 tokens = calculateTokens(weiAmount, weiRaised, currTier, 0);
    weiRaised = weiRaised.add(weiAmount);
    setTier(weiRaised);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  // Internal functions

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken(endTime);
  }

  /**
   * @dev Overriden to add finalization logic.
   * Mints remaining tokens to dev wallet
   */
  function finalization() internal {
    uint256 remainingWei = cap.sub(weiRaised);
    uint256 remainingDevTokens = calculateTokens(remainingWei, weiRaised, currTier, 0);
    token.mint(wallet, remainingDevTokens);
    CPToken(token).endSale();
    token.finishMinting();
    super.finalization();
  }


  // Private functions

  function initTiers(uint256[] _tierRates, uint256[] _tierAmountCaps) private {
    require(_tierAmountCaps.length == numTiers);
    require(_tierRates.length == numTiers);
    require (_tierAmountCaps[numTiers.sub(1)] == cap);
    for (uint i=0; i < _tierAmountCaps.length; i++) {
      // every successive tierCap should be greater than the last
      require(i == 0 || tierAmountCaps[i.sub(1)] < _tierAmountCaps[i]);
      tierAmountCaps.push(_tierAmountCaps[i]);
      tierRates.push(_tierRates[i]);
    }
  }

  function setTier(uint256 _weiRaised) private {
    while(_weiRaised > tierAmountCaps[currTier]) {
      currTier = currTier.add(1);
      assert(currTier < numTiers);
    }
  }

  // can't override `validPurchase` because need to pass additional values
  function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei) private constant returns (bool) {
    bool beneficiaryPurchasedPreviously = hasPurchased[beneficiary];
    bool belowMaxWhitelistPurchase = amountWei <= maxWhitelistPurchaseWei;
    return (openWhitelistValidPurchase(buyer, beneficiary)
            && !beneficiaryPurchasedPreviously
            && belowMaxWhitelistPurchase);
  }

  // @return true if `now` is within the bounds of the whitelist period
  function isWhitelistPeriod() private constant returns (bool) {
    return (now <= whitelistEndTime && now >= startTime);
  }

  // can't override `validPurchase` because need to pass additional values
  function openWhitelistValidPurchase(address buyer, address beneficiary) private constant returns (bool) {
    bool buyerIsBeneficiary = buyer == beneficiary;
    bool signedup = aw.isSignedUp(beneficiary);
    return (buyerIsBeneficiary && signedup);
  }

  // @return true if `now` is within the bounds of the open whitelist period
  function isOpenWhitelistPeriod() private constant returns (bool) {
    bool cappedWhitelistOver = now > whitelistEndTime;
    bool openWhitelistPeriod = now <= openWhitelistEndTime;
    return cappedWhitelistOver && openWhitelistPeriod;
  }

  /**
   * @dev Calculates how many tokens a given amount of wei can buy
   * Takes into account tiers of purchase bonus
   * Recursive, but depth is limited to the number of tiers, which is 6
   */
  function calculateTokens(uint256 _amountWei, uint256 _weiRaised, uint256 _tier, uint256 tokenAcc) private constant returns (uint256) {
    assert(_tier < numTiers);
    uint256 currRate = tierRates[_tier];
    uint256 tierAmountLeftWei = tierAmountCaps[_tier].sub(_weiRaised);
    if (_amountWei <= tierAmountLeftWei) {
      return tokenAcc.add(_amountWei.mul(currRate));
    }
    else {
      return calculateTokens(_amountWei.sub(tierAmountLeftWei), _weiRaised.add(tierAmountLeftWei), _tier.add(1), tokenAcc.add(tierAmountLeftWei.mul(currRate)));
    }
  }

}
