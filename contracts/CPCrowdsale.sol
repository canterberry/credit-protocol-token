pragma solidity ^0.4.13;

import './CPToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';


contract CPCrowdsale is CappedCrowdsale {

  //refer to weiRaised in the parent to check what level we're at
  uint public currLevel = 0;

  uint public numDevTokens = 5; //change this to a number that lets dev wallet get tokens

  function CPCrowdsale(uint256 _startBlock, uint256 _endBlock, uint256 _rate, address _wallet, uint _cap)
    CappedCrowdsale(_cap)
    Crowdsale(_startBlock, _endBlock, _rate, _wallet)
  {
    token.mint(_wallet, numDevTokens); //distribute agreed amount of tokens to devs
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }
}

/* todo:
how does whitelist work?
how do we set aside half the allocation for whitelist?
-we have a whitelist period, with whitelist rules. Then after that, everything is normal

1. check whitelist with a portion of the sale
2. pass the levels and their amounts
  -add to total wei each time
  -if total wei goes past currLevel,


3. Finalization
  -mint more tokens and give them to the wallet
  -override buyTokens so that the wallet can always purchase up to a certain cap, for free

 */
