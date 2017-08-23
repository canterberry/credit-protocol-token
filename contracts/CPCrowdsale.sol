pragma solidity ^0.4.13;

import './CPToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';


contract CPCrowdsale is Crowdsale {

  function CPCrowdsale(uint256 _startBlock, uint256 _endBlock, uint256 _rate, address _wallet, uint cap) Crowdsale(_startBlock, _endBlock, _rate, _wallet) {
  }

  function createTokenContract() internal returns (MintableToken) {
    return new CPToken();
  }

}
