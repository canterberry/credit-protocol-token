pragma solidity 0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract Helpers {
  using SafeMath for uint256;

  uint256 public cpCap = 45000 ether;
  uint256 public presaleWeiSold = 18000 ether;

  uint256[6] public tierAmountCaps =  [ presaleWeiSold
                                      , presaleWeiSold + 5000 ether
                                      , presaleWeiSold + 10000 ether
                                      , presaleWeiSold + 15000 ether
                                      , presaleWeiSold + 21000 ether
                                      , cpCap
                                      ];
  uint256[6] public tierRates = [ 2000 // tierRates[0] should never be used, but it is accurate
                                , 1500 // Tokens are purchased at a rate of 105-150
                                , 1350 // per deciEth, depending on purchase tier.
                                , 1250 // tierRates[i] is the purchase rate of tier_i
                                , 1150
                                , 1050
                                ];

    function tierIndexByWeiAmount(uint256 weiLevel) public constant returns (uint256) {
        require(weiLevel <= cpCap);
        for (uint256 i = 0; i < tierAmountCaps.length; i++) {
            if (weiLevel <= tierAmountCaps[i]) {
                return i;
            }
        }
    }

    /**
     * @dev Calculates how many tokens a given amount of wei can buy at
     * a particular level of weiRaised. Takes into account tiers of purchase
     * bonus
     */
    function calculateTokens(uint256 _amountWei, uint256 _weiRaised) public constant returns (uint256) {
        uint256 currentTier = tierIndexByWeiAmount(_weiRaised);
        uint256 startWeiLevel = _weiRaised;
        uint256 endWeiLevel = _amountWei.add(_weiRaised);
        uint256 tokens = 0;
        for (uint256 i = currentTier; i < tierAmountCaps.length; i++) {
            if (endWeiLevel <= tierAmountCaps[i]) {
                tokens = tokens.add((endWeiLevel.sub(startWeiLevel)).mul(tierRates[i]));
                break;
            } else {
                tokens = tokens.add((tierAmountCaps[i].sub(startWeiLevel)).mul(tierRates[i]));
                startWeiLevel = tierAmountCaps[i];
            }
        }
        return tokens;
    }


    // can't override `validPurchase` because need to pass additional values
    function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei, bool hasPurchased, uint256 maxWhitelistPurchaseWei, bool isSignedUp) public constant returns (bool) {
      bool beneficiaryPurchasedPreviously = hasPurchased;
      bool belowMaxWhitelistPurchase = amountWei <= maxWhitelistPurchaseWei;
      return (openWhitelistValidPurchase(buyer, beneficiary, isSignedUp)
              && !beneficiaryPurchasedPreviously
              && belowMaxWhitelistPurchase);
    }

    // @return true if `now` is within the bounds of the whitelist period
    function isWhitelistPeriod(uint256 _now, uint256 startTime, uint256 whitelistEndTime) public constant returns (bool) {
        return (_now <= whitelistEndTime && _now >= startTime);
    }

    // can't override `validPurchase` because need to pass additional values
    function openWhitelistValidPurchase(address buyer, address beneficiary, bool _isSignedUp) public constant returns (bool) {
        bool buyerIsBeneficiary = buyer == beneficiary;
        return (buyerIsBeneficiary && _isSignedUp);
    }

    // @return true if `now` is within the bounds of the open whitelist period
    function isOpenWhitelistPeriod(uint256 _now2, uint256 _whitelistEndTime, uint256 _openWhitelistEndTime) public constant returns (bool) {
        bool cappedWhitelistOver = _now2 > _whitelistEndTime;
        bool openWhitelistPeriod = _now2 <= _openWhitelistEndTime;
        return cappedWhitelistOver && openWhitelistPeriod;
    }

}
