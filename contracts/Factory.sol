pragma solidity ^0.4.15;

import './CPCrowdsale.sol';


contract Factory {

    function createCPCrowdsale(address _fundsWallet) returns(address created)
    {
        return new EspeoTokenIco(_fundsWallet);
    }
}
