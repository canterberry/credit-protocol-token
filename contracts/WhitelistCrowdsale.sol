pragma solidity ^0.4.13;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';


//OBSOLETE: this coin wouldn't work for a 2nd sale, or would it??
contract WhitelistCrowdsale is CappedCrowdsale {

  using SafeMath for uint256;

  AbstractWhitelist aw;
  mapping ( address => bool ) hasPurchased; //has whitelist address purchased already
  uint256 maxWeiPurchase;

  //whitelistAllocation is the number of CPT tokens each whitelist address gets
  //question: should it have decimals?
  function WhitelistCrowdsale(uint256 _startBlock, uint256 _endBlock, uint256 _rate, address _wallet, uint _cap, address _whitelistContract)
    CappedCrowdsale(_cap)
    Crowdsale(_startBlock, _endBlock, _rate, _wallet)
  {
    aw = AbstractWhitelist(_whitelistContract);
    maxWeiPurchase = (_cap * (1 ether)).div(aw.numUsers());
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }

  //override to check whitelist for purchaser
  function buyTokens(address beneficiary) payable {
    uint256 weiAmount = msg.value;
    require( weiAmount <= maxWeiPurchase );
    require( aw.isSignedUp(beneficiary) );
    require( !hasPurchased[beneficiary] );

    hasPurchased[beneficiary] = true;

    super.buyTokens(beneficiary);
  }

}

/* todo:
how does whitelist work?
how do we set aside half the allocation for whitelist?

1. check whitelist with a portion of the sale
2. pass the levels and their amounts
  -add to total wei each time
  -if total wei goes past currLevel,


capEth*rate = totalTokens / n

 */
