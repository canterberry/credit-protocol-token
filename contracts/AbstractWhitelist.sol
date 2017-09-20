pragma solidity 0.4.15;

contract AbstractWhitelist {
    function isSignedUp(address addr) public constant returns (bool);
    function numUsers() public constant returns (uint);
}
