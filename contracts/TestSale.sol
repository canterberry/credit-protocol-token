pragma solidity ^0.4.13;

import './CPToken.sol';
//import './AbstractWhitelist.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';

contract TestSale is CappedCrowdsale, FinalizableCrowdsale {
  using SafeMath for uint256;

  function TestSale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _cap)
    CappedCrowdsale(_cap)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    FinalizableCrowdsale()
  {
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }
}
