pragma solidity 0.4.15;

import './CPToken.sol';
import './AbstractWhitelist.sol';
import './AbstractTiers.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract CPCrowdsale is CappedCrowdsale, FinalizableCrowdsale, Pausable {
    using SafeMath for uint256;

    address public airdropWallet;
    address public advisorWallet;
    address public stakingWallet;
    address public privateSaleWallet;

    uint256 public constant decimals = 18;
    uint256 public cpCap = 45000 ether;
    uint256 public constant dummyRate = 1;

    uint256 public presaleWeiSold = 18000 ether;
    uint256 public nonPublicTokens = 82458667 * (10 ** decimals);

    uint256 public initialAirdropTokens = 5807933 * (10 ** decimals);
    uint256 public initialAdvisorTokens = 5807933 * (10 ** decimals);
    uint256 public initialStakingTokens = 11615867 * (10 ** decimals);
    uint256 public initialPrivateSaleTokens = 36000000 * (10 ** decimals);
    uint256 public initialDevTokens = nonPublicTokens - (initialAirdropTokens + initialAdvisorTokens + initialStakingTokens + initialPrivateSaleTokens);

    AbstractWhitelist private aw;
    AbstractTiers private at;
    mapping (address => bool) private hasPurchased; // has whitelist address purchased already
    uint256 public whitelistEndTime;
    uint256 public maxWhitelistPurchaseWei;
    uint256 public openWhitelistEndTime;

    function CPCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _whitelistEndTime, uint256 _openWhitelistEndTime, address _wallet, address _tiersContract, address _whitelistContract, address _airdropWallet, address _advisorWallet, address _stakingWallet, address _privateSaleWallet)
        CappedCrowdsale(cpCap)
        FinalizableCrowdsale()
        Crowdsale(_startTime, _endTime, dummyRate, _wallet)  // rate is a dummy value; we use tiers instead
    {
        airdropWallet     = _airdropWallet;
        advisorWallet     = _advisorWallet;
        stakingWallet     = _stakingWallet;
        privateSaleWallet = _privateSaleWallet;

        token.mint(_wallet, initialDevTokens);
        token.mint(airdropWallet, initialAirdropTokens);
        token.mint(advisorWallet, initialAdvisorTokens);
        token.mint(stakingWallet, initialStakingTokens);
        token.mint(privateSaleWallet, initialPrivateSaleTokens);

        aw = AbstractWhitelist(_whitelistContract);
        require (aw.numUsers() > 0);
        at = AbstractTiers(_tiersContract);
        whitelistEndTime = _whitelistEndTime;
        openWhitelistEndTime = _openWhitelistEndTime;
        weiRaised = presaleWeiSold;
        maxWhitelistPurchaseWei = (cap.sub(weiRaised)).div(aw.numUsers());
    }

    // Public functions
    function buyTokens(address beneficiary) public payable whenNotPaused {
        uint256 weiAmount = msg.value;

        require(beneficiary != 0x0);
        require(validPurchase());
        require(!isWhitelistPeriod()
             || whitelistValidPurchase(msg.sender, beneficiary, weiAmount));
        require(!isOpenWhitelistPeriod()
             || openWhitelistValidPurchase(msg.sender, beneficiary));

        hasPurchased[beneficiary] = true;

        uint256 tokens = at.calculateTokens(weiAmount, weiRaised);
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
            uint256 remainingDevTokens = at.calculateTokens(remainingWei, weiRaised);
            token.mint(wallet, remainingDevTokens);
        }
        CPToken(token).endSale();
        token.finishMinting();
        super.finalization();
    }

    // Private functions

    // can't override `validPurchase` because need to pass additional values
    function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei) private constant returns (bool) {
        bool beneficiaryPurchasedPreviously = hasPurchased[beneficiary];
        bool belowMaxWhitelistPurchase = amountWei <= maxWhitelistPurchaseWei;
        return (openWhitelistValidPurchase(buyer, beneficiary)
                && !beneficiaryPurchasedPreviously
                && belowMaxWhitelistPurchase);
    }

    // @return true if `now` is within the bounds of the whitelist period
    function isWhitelistPeriod() private constant returns (bool) {
        return (now <= whitelistEndTime && now >= startTime);
    }

    // can't override `validPurchase` because need to pass additional values
    function openWhitelistValidPurchase(address buyer, address beneficiary) private constant returns (bool) {
        bool buyerIsBeneficiary = buyer == beneficiary;
        bool signedup = aw.isSignedUp(beneficiary);
        return (buyerIsBeneficiary && signedup);
    }

    // @return true if `now` is within the bounds of the open whitelist period
    function isOpenWhitelistPeriod() private constant returns (bool) {
        bool cappedWhitelistOver = now > whitelistEndTime;
        bool openWhitelistPeriod = now <= openWhitelistEndTime;
        return cappedWhitelistOver && openWhitelistPeriod;
    }

}
