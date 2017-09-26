# Contract Audit: BlockMason

## Preamble
This audit report was undertaken by @adamdossa for the purpose of providing feedback to BlockMason. It has been written without any express or implied warranty.

The contract reviewed was the verified Solidity code found at:  
https://github.com/blockmason/tce-contracts/blob/26feb63a1bf7e6b5ba5f0ef25e9a6e38e06a2893

## Classification

### Defect Severity
* **Minor** - A defect that does not have a material impact on the contract execution and is likely to be subjective.
* **Moderate** - A defect that could impact the desired outcome of the contract execution in a specific scenario.
* **Major** - A defect that impacts the desired outcome of the contract execution or introduces a weakness that may be exploited.
* **Critical** - A defect that presents a significant security vulnerability or failure of the contract across a range of scenarios.

## Summary

Overall these contracts were well-structured, commented and had no moderate, major or critical issues. None of the items noted below represent security issues, but are more stylistic in nature, and optional to resolve.

I note that the contract has already been audited and so this is a second audit which represents good practice.

## Contract Audit

### CPToken.sol

This contract inherits from the OpenZeppelin contracts `MintableToken.sol` and `LimitedTransferToken.sol`.

It restricts token transfers until either the `releaseTime` (set in the constructor) or until `endSale()` is called manually by the contract owner, in this case the `CPCrowdsale.sol` contract.

Beyond the minor issue noted below, this contract is straightforward and secure.

**Minor**

In [line 15](https://github.com/blockmason/tce-contracts/blob/26feb63a1bf7e6b5ba5f0ef25e9a6e38e06a2893/contracts/CPToken.sol#L15) the value of `_releaseTime` is not sanity checked. For example it may be sensible to `require(_releaseTime > now)` or similar.

### CPCrowdsale.sol

This contract defines the behavior during the crowdsale period.

Beyond the minor issues noted below, this contract is straightforward and secure.

**Minor**

In [line 47](https://github.com/blockmason/tce-contracts/blob/26feb63a1bf7e6b5ba5f0ef25e9a6e38e06a2893/contracts/CPCrowdsale.sol#L47) the constructor does not sanity check the variables `_whitelistEndTime` and `_openWhitelistEndTime`. It may be sensible to `require(_openWhitelistEndTime > _whitelistEndTime)` and `require(_whitelistEndTime > _startTime)`.

**Minor**

In [line 140](https://github.com/blockmason/tce-contracts/blob/26feb63a1bf7e6b5ba5f0ef25e9a6e38e06a2893/contracts/CPCrowdsale.sol#L140) the comment indicates that the `calculateTokens` function is recursive. The implementation is now iterative rather than recursive, so this comment should be amended for clarity.

**Minor**

In [line 142](https://github.com/blockmason/tce-contracts/blob/26feb63a1bf7e6b5ba5f0ef25e9a6e38e06a2893/contracts/CPCrowdsale.sol#L142) the function `calculateTokens` takes as an argument `_weiRaised`. Whilst this is fine, since this value is always sourced from the state variable `weiRaised` taking it as a parameter is not strictly necessary and it may reduce the gas consumed to remove this. I also note that this function is marked as both `private` and `constant`. Constant functions can be computed off-chain, but since it is `private` this is not possible as far as I am aware, so it may be better to simply mark it as `constant` (I can see no particular reason to keep it `private`).

**Minor**

In [line 28](https://github.com/blockmason/tce-contracts/blob/26feb63a1bf7e6b5ba5f0ef25e9a6e38e06a2893/contracts/CPCrowdsale.sol#L28) where you define `tierRates` you comment that "Tokens are purchased at a rate of 105-150 per deciEth". I couldn't find a reference to "deciEth" online, so not entirely sure what this means. As per the `calculateTokens` function the rates defined in `tierRates` represent the number of tokens (at different tiers) issued per ether. This comment could be clarified.

**Comment**

In functions `whitelistValidPurchase` and `openWhitelistValidPurchase`, `weiAmount` is always `msg.value`. It would be possible to reference this directly rather than taking it as a parameter.

**Comment**

For this crowdsale the `initialOwnerTokens` are not locked for any duration. It is common in ICOs to lock team / founder tokens for some period, possible incorporating vesting logic to increase the amount available over a period of time.

**Comment**

With this implementation of a crowdsale I note that a contribution that would mean the `weiRaised` exceeds the total cap, would be rejected (as implemented in `validPurchase()` in `CappedCrowdsale.sol`). This is reasonable, but does mean that you are less likely to exactly meet your cap. An alternative approach is to refund any transferred value that exceeds the cap, rather than the full amount (and mint tokens accordingly).

**Comment**

I note that given the implementation (specifically `hasPurchased`) it is not possible for a contributor to take up their whitelist allocation in multiple transactions. This is fine, but may be worth stressing in the details given to your community for the crowdsale.

### DPIcoWhitelist.sol

This contract holds the list of whitelisted addresses, and has been deployed at `0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602` on the Mainnet.

Beyond the comment noted below, this contract is straightforward and secure.

NB - this contract has now been locked down by setting `signUpOn` to `false`.

**Comment**

Since all of the state variables in this contract are marked as `public` having explicitly defined getter functions (e.g. `getAdmin`, `signUpOn`) is not really required. There is however no obvious downside to having these functions.

## Tests Audit

In general the test cases are well-written, check both failure and success cases, and have a comprehensive scope. I have noted a couple of possible additional test cases below that you may wish to consider implementing.

I executed all tests (using `runtest.sh`) and they completed successfully, outputing the below:  
```
Adams-MBP:tce-contracts adamdossa$ ./runtest.sh
Started testrpc, pid 1271
Using network 'testrpc'.

  Contract: CPCrowdsale
    Before start
      ✓ rejects payment before start
      ✓ mints the correct number of developer tokens
      ✓ sets the tiers correctly (315ms)
    Whitelist period
      ✓ calculates whitelist max purchase correctly (44ms)
      ✓ does not allow non-beneficiary to do a whitelist buy
      ✓ does not allow non-whitelisted user to do a whitelist buy
      ✓ does not allow a buy over the max during whitelist period
      ✓ allows buy up to max during whitelist period (46ms)
      ✓ allows owner to pause buys
      ✓ does not allow double purchasing during the whitelist period (53ms)
      ✓ should forward funds to wallet (224ms)
    Open Whitelist period
      ✓ does not allow non-beneficiary to do a open whitelist buy
      ✓ does not allow non-whitelisted user to do a open whitelist buy
      ✓ allows a buy over the max during open whitelist period (52ms)
      ✓ allows double purchasing during the open whitelist period (92ms)
      ✓ should forward funds to wallet (269ms)
    Normal buying period
true
      ✓ buy cap results in proper amount of tokens created (203ms)
      ✓ allows buy over the max (53ms)
      ✓ allows double purchasing (93ms)
      ✓ allows owner to pause buys (178ms)
      ✓ allows non-beneficiary to buy for beneficiary (49ms)
      ✓ allows finalization of contract and release of tokens once cap is reached (145ms)
      ✓ should forward funds to wallet (483ms)
      ✓ allocates the correct number of tokens (199ms)
    End and finalization
      ✓ rejects payments after end
      ✓ finalizes the contract (90ms)
      ✓ can't finalize twice (112ms)
    Whitelist to normal period transition
      ✓ can buy on whitelist, then buy in normal period (257ms)
      ✓ rejected on whitelist, can buy in normal period (289ms)
      ✓ can't double buy whitelist, can double buy in normal period (312ms)
      ✓ multiple users buy before and after whitelist (753ms)

  31 passing (19s)
```

**Minor**

In test case "allows finalization of contract and release of tokens once cap is reached", it looks like you don't check that tokens are actually released (i.e. are transferrable) after the crowdsale is finalized. You could for example use the `transfer` function to transfer tokens between two accounts and check balances are updated accordingly. You may also want to check that the `transfer` function does not work before the crowdsale is finalized.

**Comment**

I note that you have the following test case commented out:  
`allocates the correct number of tokens`
I can't see any reason for this? This test case does execute successfully.

**Comment**

You also have the test cases:  
```
handles different _amountWei inputs
tierIndexByWeiAmount
```
commented out. These do not execute successfully if uncommented as the functions `calculateTokens` and `tierIndexByWeiAmount` are set to be private. I can't really see any reason for keeping these functions private and commenting out these cases? Possibly by making them public it would allow another smart contract or web3 script to query these directly, but I don't think that would provide an attack vector.
