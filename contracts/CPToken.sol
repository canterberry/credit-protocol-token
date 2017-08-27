pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract CPToken is MintableToken {
  string public name = "CREDIT PROTOCOL TOKEN";
  string public symbol = "CPT";
  uint256 public decimals = 0;
}
