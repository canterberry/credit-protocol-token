pragma solidity 0.4.15;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/LimitedTransferToken.sol';

contract CPToken is MintableToken, LimitedTransferToken {
  string public name = "CREDIT PROTOCOL TOKEN";
  string public symbol = "CPT";
  uint256 public decimals = 18;

  uint256 releaseTime;

  function CPToken(uint256 _releaseTime) {
    releaseTime = _releaseTime;
  }

  /**
   * @dev returns all user's tokens if time >= releaseTime
   */
  function transferableTokens(address holder, uint64 time) public constant returns (uint256) {
    if ( time >= releaseTime )
      return balanceOf(holder);
    else
      return 0;
  }

}
