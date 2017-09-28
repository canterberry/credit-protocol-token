pragma solidity ^0.4.15;

import './CPCrowdsale.sol';


contract Factory {

    function createCPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, uint256 _openWhitelistEndTime, address _wallet, address _whitelistContract, address _airdropWallet, address _advisorWallet, address _stakingWallet, address _privateSaleWallet) returns(address created)
    {
      return new CPCrowdsale(_startTime, _endTime, _whitelistEndTime, _openWhitelistEndTime, _wallet, _whitelistContract, _airdropWallet, _advisorWallet, _stakingWallet, _privateSaleWallet);
    }
}
