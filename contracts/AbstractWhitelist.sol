pragma solidity ^0.4.13;

contract AbstractWhitelist {
  function isSignedUp(address addr) constant returns (bool);
  function numUsers() constant returns (uint);
}
