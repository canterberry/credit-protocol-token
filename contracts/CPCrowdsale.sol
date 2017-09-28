pragma solidity 0.4.15;

import './CPToken.sol';
import './DPIcoWhitelist.sol';
import './Helpers.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract CPCrowdsale is CappedCrowdsale, FinalizableCrowdsale, Pausable {
    using SafeMath for uint256;

    DPIcoWhitelist private aw;
    Helpers private ah;
    mapping (address => bool) private hasPurchased; // has whitelist address purchased already
    uint256 public whitelistEndTime;
    uint256 public maxWhitelistPurchaseWei;
    uint256 public openWhitelistEndTime;

    function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, uint256 _openWhitelistEndTime, address _wallet, address _helpersContract, address _whitelistContract, address _airdropWallet, address _advisorWallet, address _stakingWallet, address _privateSaleWallet)
        CappedCrowdsale(45000 ether)
        FinalizableCrowdsale()
        Crowdsale(_startTime, _endTime, 1, _wallet)  // 1 is a dummy value; we use tiers instead
    {
        token.mint(_wallet, 23226934 * (10 ** 18));
        token.mint(_airdropWallet, 5807933 * (10 ** 18));
        token.mint(_advisorWallet, 5807933 * (10 ** 18));
        token.mint(_stakingWallet, 11615867 * (10 ** 18));
        token.mint(_privateSaleWallet, 36000000 * (10 ** 18));

        aw = DPIcoWhitelist(_whitelistContract);
        require (aw.numUsers() > 0);
        ah = Helpers(_helpersContract);
        whitelistEndTime = _whitelistEndTime;
        openWhitelistEndTime = _openWhitelistEndTime;
        weiRaised = 18000 ether;
        maxWhitelistPurchaseWei = (cap.sub(weiRaised)).div(aw.numUsers());
    }

    // Public functions
    function buyTokens(address beneficiary) public payable whenNotPaused {
        uint256 weiAmount = msg.value;

        require(beneficiary != 0x0);
        require(validPurchase());

        require(!ah.isWhitelistPeriod(now, startTime, whitelistEndTime)
                || ah.whitelistValidPurchase(msg.sender, beneficiary, weiAmount, hasPurchased[beneficiary], maxWhitelistPurchaseWei, aw.isSignedUp(beneficiary)));

        require(!ah.isOpenWhitelistPeriod(now, whitelistEndTime, openWhitelistEndTime)
                || ah.openWhitelistValidPurchase(msg.sender, beneficiary, aw.isSignedUp(beneficiary)));

        hasPurchased[beneficiary] = true;

        uint256 tokens = ah.calculateTokens(weiAmount, weiRaised);
        weiRaised = weiRaised.add(weiAmount);
        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
        forwardFunds();
    }

    // Internal functions

    function createTokenContract() internal returns (MintableToken) {
        return new CPToken();
    }

    /**
     * @dev Overriden to add finalization logic.
     * Mints remaining tokens to dev wallet
     */
    function finalization() internal {
        uint256 remainingWei = cap.sub(weiRaised);
        if (remainingWei > 0) {
            uint256 remainingDevTokens = ah.calculateTokens(remainingWei, weiRaised);
            token.mint(wallet, remainingDevTokens);
        }
        CPToken(token).endSale();
        token.finishMinting();
        super.finalization();
    }

}
