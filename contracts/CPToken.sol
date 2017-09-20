pragma solidity 0.4.15;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/LimitedTransferToken.sol';

contract CPToken is MintableToken, LimitedTransferToken {
    string public name = "CREDIT PROTOCOL TOKEN";
    string public symbol = "BCPT";
    uint256 public decimals = 18;

    uint256 public releaseTime;
    bool public saleOver = false;

    function CPToken(uint256 _releaseTime) {
        releaseTime = _releaseTime;
    }

    function endSale() public onlyOwner {
        require (!saleOver);
        saleOver = true;
    }

    /**
     * @dev returns all user's tokens if time >= releaseTime
     */
    function transferableTokens(address holder, uint64 time) public constant returns (uint256) {
        if (time >= releaseTime || saleOver)
            return balanceOf(holder);
        else
            return 0;
    }

}
