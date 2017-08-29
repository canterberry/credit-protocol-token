pragma solidity ^0.4.13;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';

contract CPCrowdsale is CappedCrowdsale {

  uint256[] public tierRates;
  uint256[] public tierAmountCaps;
  uint256 public curTierLevel = 0;

  AbstractWhitelist aw;
  mapping ( address => bool ) hasPurchased; //has whitelist address purchased already
  uint256 whitelistEndBlock;
  uint256 maxWeiPurchase;

  function CPCrowdsale(uint256 _startBlock, uint256 _endBlock, uint256 _rate, address _wallet, uint _cap, address whitelistContract, uint numDevTokens)
    CappedCrowdsale(_cap)
    Crowdsale(_startBlock, _endBlock, _rate, _wallet)
  {
    aw = AbstractWhitelist(whitelistContract);
    maxWeiPurchase = (_cap * (1 ether)).div(aw.numUsers());
    whitelistEndBlock = _whitelistEndBlock;
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

    if ( isWhitelistPeriod)
    require( weiAmount <= maxWeiPurchase );
    require( aw.isSignedUp(beneficiary) );
    require( !hasPurchased[beneficiary] );
    //checks
    require(beneficiary != 0x0);
    require(validPurchase());

    //move to whitelist part
    hasPurchased[beneficiary] = true;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  function customValid(uint256 weiAmount) internal constant returns (bool) {
    bool valid = false;
    return valid && validPurchase();
  }
}

/* todo:

maxEth per purchase for whitelist = _cap/numUsers()

override buyTokens fully

1. Mint tokens to devs
2. Mint tokens to pre-buyers
3. Start a whitelist period
4. End the whitelist period after 5 days
5. See how much Eth is left to sell
6. Sell for 25 days or until all tokens sold
7. Mint tokens up to the amount of Eth remaining, and give to devs at the end


validation:
-have to have custom minting logic, so need a complete override of buyTokens
-need a custom validator

 */
