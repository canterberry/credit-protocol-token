# Preliminary audit of `blockmason/tce-contracts`

Audit completed on 2017.09.19 by [Roy Blankman](https://github.com/aupiff)

Beyond suggesting safety improvements to the CPToken crowdsale contracts, I made the improvements myself and implemented several new features. Pertinent changes to the code are reproduced in this document as diffs along with links to their corresponding commits. My audit took place after the deployment of the whitelist contract and thus no modifications I made changed the functionality or safety of the whitelist. The overview section below reflects the state of the contracts after my modifications.

- first commit evaluated: [1a5754e9a81b3f30fd028898727bb9c23e3b64bf](https://github.com/blockmason/tce-contracts/tree/1a5754e9a81b3f30fd028898727bb9c23e3b64bf)
- last commit containing my modifications: [6e3a1d4c823022392182a6ec86df3fc599d5c811](https://github.com/blockmason/tce-contracts/tree/6e3a1d4c823022392182a6ec86df3fc599d5c811)

## TL;DR

- No serious problems were found in the code but many alterations were made to conform with best practices of style and security. The contract code is not likely susceptible to any known smart contract exploits.
- Most of the contracts' functionality is derived from the well-tested OpenZeppelin library [`zeppelin-solidity`](https://github.com/OpenZeppelin/zeppelin-solidity). Use of this library made the audit relatively easy.
- The custom implementation of purchase tiers is potentially dangerous
- The custom implementation of whitelist periods is potentially dangerous
- Documentation, build reproducibility and testing of the code were inadequate before the audit. Documentation and testing could still be improved.

## Overview of project

There are three primary components of the BlockMason crowdsale:

1. Whitelist contract: `DPIcoWhitelist.sol`
2. Crowdsale contract: `CPCrowdsale.sol`
3. Token contract: `CPToken.sol`

### Whitelist

`DPIcoWhitelist.sol` is a custom whitelist implementation. The contract maintains a public mapping of addresses to booleans, `mapping (address => bool) public whitelist`, which maps whitelisted addresses to `true` and addresses not on the whitelist to `false`. Users sign up by sending 0 eth transactions to the whitelist contract address (though non-zero transactions are accepted). The owner of the whitelist contract is the address that created it. The owner can turn on or off the ability for new users to sign up. Note that the owner is called `admin` in the code.

### Crowdsale

`CPCrowdsale.sol` defines a crowdsale that inherits from OpenZeppelin's `CappedCrowdsale`, `FinalizableCrowdsale`, and `Pausable` contracts. The address that creates `CPCrowdsale.sol` is the owner of the contract. `CPCrowdsale.sol` allows users to buy tokens up to some `cap` via the only public function `buyTokens`. The superclasses provide the following functionality:

- `CappedCrowdsale`: The crowdsale has a `cap` which is set during initialization. All valid purchases must not increase the var `weiRaised` beyond the value of `cap`. The sale is considered to have ended either when the sale period has ended OR when `weiRaised >= cap`.
- `FinalizableCrowdsale`: The owner is able to finalize the contract by calling the contract's `finalize` function when either the sale period has ended OR when `weiRaised >= cap`. Finalization does the following:
   + delivers the difference `cap - weiRaised` to the owner's token wallet.
   + releases tokens, i.e. allows tokens to be transferred
   + calls the `finishMinting` function of `CPToken.sol` so that no more tokens can be minted.
- `Pausable`: The owner is able to pause the ability to call the contract's only public function, `buyTokens`.

The crowdsale contract creates a new `CPToken` in the `createTokenContract` function which is called by `Crowdsale.sol`'s initialization function. This token is referenced in the crowdsale contract by the public var `token`.

### Token

`CPToken.sol` defines a token which inherits from OpenZeppelin's `MintableToken` and `LimitedTransferToken` contracts. The token contract is owned by the address that creates it, which in this case is `CPCrowdsale.sol`. The superclasses provide the following functionality:

- `Mintable`: `CPToken.sol`'s owner is able to mint tokens to various addresses up until the owner calls the `finishMinting` function. In the current implementation, `finishMinting` is called by `CPCrowdsale.sol` in its `finalize` function.
- `LimitedTransferToken`: Token transfers are only allowed after the time indicated as the end of the crowdsale or potentially earlier if the crowdsale's owner calls `finalize()` successfully after the crowdsale cap has been reached.

## Safety improvements

### Use SafeMath consistently

A small number of numerical computations were updated to use SafeMath functions in place of the default arithmetic operators. All computations should be checked for integer underflow and overflow.

```
 -    maxWhitelistPurchaseWei = (cap - weiRaised).div(aw.numUsers());
 +    maxWhitelistPurchaseWei = (cap.sub(weiRaised)).div(aw.numUsers());
```
[diff](https://github.com/blockmason/tce-contracts/pull/1/commits/57c685a9e85bb382d9841103135e280cbd5ce665)

### Remove pseudo-assertion, ensuring `finalization` fails loudly

Pre-audit, the `finalization` function of `CPCrowdsale.sol` contained a pseudo-assertion (`if (cap <= weiRaised) return`) that `return`ed instead of `throwing`. This is dangerous since no function should ever fail silently. Luckily, the same check is performed via the SafeMath `sub` function in the line following the pseudo-assertion but with the proper `throw` semantics (`cap.sub(weiRaised)`). The pseudo-assertion has been removed to ensure an exception is thrown whenever `cap <= weiRaised`.

```
    function finalization() internal {
 -    if (cap <= weiRaised) return;
      uint256 remainingWei = cap.sub(weiRaised);
      uint256 remainingDevTokens = calculateTokens(remainingWei, weiRaised, currTier, 0);
```

[diff](https://github.com/blockmason/tce-contracts/pull/2/commits/fa706ca2cb2cc36c4f4c8a42f6b977b205165a92)

### Make `finishMinting` call in `finalization`

Those purchasing CPTokens should be confident that the quantity of tokens is limited to the amount indicated by BlockMason's website. Stopping future minting requires calling `CPToken.sol`'s `finishMinting` function and the crowdsale contract, as owner of the token contract, is the only address that can call `finishMinting`. The critical call has been added to `CPCrowdsale.sol`'s `finalization` function.

```
   function finalization() internal {
     uint256 remainingWei = cap.sub(weiRaised);
      uint256 remainingDevTokens = calculateTokens(remainingWei, weiRaised, currTier, 0);
      token.mint(wallet, remainingDevTokens);
      CPToken(token).endSale();
 +    token.finishMinting();
      super.finalization();
    }
```

[diff](https://github.com/blockmason/tce-contracts/pull/4/commits/ba7eb24da7e443cab2c48adf378f967208d30dd9)

### Improve tiers-related functions

#### Improve `setTier` function in `CPCrowdsale.sol`

`setTier` was written with the assumption that it would be called by `buyTokens` and only after the caller executed the line `require(validPurchase())`. Otherwise, its while loop could potentially be infinite. `setTier` should make no assumptions about its callers; it should do what it says it does and do it safely under any circumstances. `assert(currTier < numTiers)` has been added to the while loop's body to make the function safe.

```
   function setTier(uint256 _weiRaised) private {
      while(_weiRaised > tierAmountCaps[currTier]) {
        currTier = currTier.add(1);
 +      assert(currTier < numTiers);
      }
    }
```

[diff](https://github.com/blockmason/tce-contracts/pull/3/commits/cda7abd5883f24c29e07d5104aff066672441d64)

#### Improve `initTiers` function in `CPCrowdsale.sol`

`initTiers` made too many assumptions about its inputs. Verification has been added of the `_tiersRates` and `_tierAmountCaps` input arrays' lengths. The misnamed `highestAmount` var has been eliminated; it was not necessarily the highest amount, only the last value in the `_tierAmountCaps` array.

```
   function initTiers(uint256[] _tierRates, uint256[] _tierAmountCaps) private {
 -    uint256 highestAmount = _tierAmountCaps[_tierAmountCaps.length.sub(1)];
 -    require (highestAmount == cap);
 +    require(_tierAmountCaps.length == numTiers);
 +    require(_tierRates.length == numTiers);
 +    require (_tierAmountCaps[numTiers.sub(1)] == cap);
```

[diff](https://github.com/blockmason/tce-contracts/pull/3/commits/d8ae90398b87781bebde8cef6b060d19121ea32f#diff-da90c87140cbf448f81e1e0609512efbL108)

Verification has been added that `tierAmountCaps` is an array of monotonically increasing values.

```
   function initTiers(uint256[] _tierRates, uint256[] _tierAmountCaps) private {
     require(_tierAmountCaps.length == numTiers);
      require(_tierRates.length == numTiers);
      require (_tierAmountCaps[numTiers.sub(1)] == cap);
      for (uint i=0; i < _tierAmountCaps.length; i++) {
 -      tierRates.push(_tierRates[i]);
 +      // every successive tierCap should be greater than the last
 +      require(i == 0 || tierAmountCaps[i.sub(1)] < _tierAmountCaps[i]);
        tierAmountCaps.push(_tierAmountCaps[i]);
 +      tierRates.push(_tierRates[i]);
      }
    }
```

[diff](https://github.com/blockmason/tce-contracts/pull/3/commits/ccbf99f08a52317aea5f2423ca45ef06170f71a1)

#### Improve `calculateTokens` function in `CPCrowdsale.sol`

Safety of `calculateTokens` has been improved by ensuring that the value of `_tier` never exceeds `numTiers`. The function should not assume that the tiers arrays are properly initialized nor that the caller of the function provides good input.

```
    function calculateTokens(uint256 _amountWei, uint256 _weiRaised, uint256 _tier, uint256 tokenAcc) private constant returns (uint256) {
 +    assert(_tier < numTiers);
      uint256 currRate = tierRates[_tier];
```
[diff](https://github.com/blockmason/tce-contracts/pull/3/commits/d8ae90398b87781bebde8cef6b060d19121ea32f#diff-da90c87140cbf448f81e1e0609512efbL157)

#### Improve safety of `buyTokens` by altering tiers-related functions

The changes described in this section make unnecessary the comment in `buyTokens` regarding safety of `calculateTokens` and `setTier`. These functions should now be safe regardless of the prior actions of `buyTokens`.

```
 -    //setTier() and calculateTokens are safe to call because validPurchase checks
 -    //for the cap to be passed or not
```

[diff](https://github.com/blockmason/tce-contracts/pull/3/commits/d8ae90398b87781bebde8cef6b060d19121ea32f#diff-da90c87140cbf448f81e1e0609512efbR75)

### Fix tests

`increaseTimeTo` calls were updated to fix those tests which were broken by the addition of open whitelist functionality. Previously, the normal buy period followed the whitelist period directly, now it follows open whitelist period.

```
 -            await h.increaseTimeTo(this.whitelistEndTime + h.duration.hours(1));
 +            await h.increaseTimeTo(this.openWhitelistEndTime + h.duration.hours(1));
```
[diff](https://github.com/blockmason/tce-contracts/pull/1/commits/63989a03ba28cd76b660e6d50a4907ce81d7de2b)

```
 -            await h.increaseTimeTo(this.openWhitelistEndTime + h.duration.hours(1));
 +            await this.setTimeNormalPeriod();
```

```
 +        this.setTimeNormalPeriod = async function() {
 +            await h.increaseTimeTo(this.openWhitelistEndTime + h.duration.hours(1));
 +        }
```
[diff](https://github.com/blockmason/tce-contracts/pull/1/commits/517c19e031733d75a3f17a956a7f6356ce9bd542)

### Improve readability of whitelist code

A lower time bound check has been added to `isWhitelistPeriod` to make it true to its name. Before, it returned true at all times prior or equal to `whitelistEndTime`, including times prior to the sale's start.

```
    function isWhitelistPeriod() private constant returns (bool) {
 -    return (now <= whitelistEndTime);
 +    return (now <= whitelistEndTime && now >= startTime);
 ```

`hasPurchased` mapping is now updated on every `buyTokens` call because otherwise it'd be necessary to rename the variable `hasPurchasedDuringWhitelistPeriod`. The intended logic is unchanged.

```
 -    if (isWhitelistPeriod()) hasPurchased[beneficiary] = true;
 +    hasPurchased[beneficiary] = true;
```

Whitelist period checks have been made more comprehensible. The whitelist valid purchase functions should only be checked during the respective whitelist periods.

```
-    require(whitelistValidPurchase(msg.sender, beneficiary, weiAmount));
-    require(openWhitelistValidPurchase(msg.sender, beneficiary));
+    require(!isWhitelistPeriod()
+         || whitelistValidPurchase(msg.sender, beneficiary, weiAmount));
+    require(!isOpenWhitelistPeriod()
+         || openWhitelistValidPurchase(msg.sender, beneficiary));
```

Condition-checking has been improved. Previously, the `openWhitelistValidPurchase` function confusingly returned `true` when it was not the open whitelist period; a similar statement was true of `whitelistValidPurchase`.

```
    function openWhitelistValidPurchase(address buyer, address beneficiary) private constant returns (bool) {
 -    if (isOpenWhitelistPeriod()) {
 -      if (buyer != beneficiary)         return false;
 -      if (!aw.isSignedUp(beneficiary))  return false;
 -    }
 -    return true;
 +    bool buyerIsBeneficiary = buyer == beneficiary;
 +    bool signedup = aw.isSignedUp(beneficiary);
 +    return (buyerIsBeneficiary && signedup);
    }
 ``` 
 
`whitelistValidPurchase` should reuse the checks of `openWhitelistValidPurchase` to reduce redundancy and ensure consistent logic.
 
 ```   
   function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei) private constant returns (bool) {
 -    if (isWhitelistPeriod()) {
 -      if (buyer != beneficiary)                return false;
 -      if (hasPurchased[beneficiary])           return false;
 -      if (!aw.isSignedUp(beneficiary))         return false;
 -      if (amountWei > maxWhitelistPurchaseWei) return false;
 -    }
 -    return true;
 +    bool beneficiaryPurchasedPreviously = hasPurchased[beneficiary];
 +    bool belowMaxWhitelistPurchase = amountWei <= maxWhitelistPurchaseWei;
 +    return (openWhitelistValidPurchase(buyer, beneficiary)
 +            && !beneficiaryPurchasedPreviously
 +            && belowMaxWhitelistPurchase);
   }
```

[diff](https://github.com/blockmason/tce-contracts/pull/2/commits/a07bb1e8696c9d679dfe75b66b9227d6320003f1)

### Use fixed solidity version

Contracts should always use locked compiler version pragmas without a caret prefix. The near-match caret `^` only checks that major and minor versions match, in our case 0.4.x. If a dev has the newest solidity version, 0.4.16, installed on their machine, the code with near-match pragmas will compile, but with different bytecode and thus different behavior than another dev who uses `solc` 0.4.15 or 0.4.13 locally. This scenario is impossible when the carets are removed. All testing and deployment should be done with the same version of `solc`. All solidity version pragmas in the crowdsale code have been updated.

```
 -pragma solidity ^0.4.13;
 +pragma solidity 0.4.15;
```
[diff](https://github.com/blockmason/tce-contracts/pull/1/commits/676824712442ce92c6209448d5ad2b0b140206a3)

### Build reproducibly and safely

The repo was difficult to build pre-audit. It is important that auditors and interested devs can easily compile the code on most machines. Firstly, a local version of `zeppelin-solidity` was used and referenced via a relative path in a `package-lock.json` file. The `zeppelin-solidity` library is an industry standard and outside auditors should be confident that the version used is identical to some commit in OpenZeppelin's repo. We now pull in such a commit in `package.json`.

```
+    "zeppelin-solidity": "git@github.com:OpenZeppelin/zeppelin-solidity.git#1737555b0dda2974a0cd3a46bdfc3fb9f5b561b9"
```

Additionally, a number of necessary `npm` deps were missing.

```
 +    "ethereumjs-testrpc": "4.1.1",
 +    "truffle": "3.4.9",
```

[diff](https://github.com/blockmason/tce-contracts/pull/1/commits/cd869574ccf50d4971296b97c80e77905242170c)

## Style

### Remove magic numbers

Replacing magic numbers with well-named variables increases readability of code.

```
 +  uint256   public constant dummyRate = 1;
```
```
 -    Crowdsale(_startTime, _endTime, 1, _wallet)  //rate is a dummy value; we use tiers instead
 +    Crowdsale(_startTime, _endTime, dummyRate, _wallet)  // rate is a dummy value; we use tiers instead
```

[diff](https://github.com/blockmason/tce-contracts/pull/3/commits/a4da8f04e3e447eccad7976e886b191352feb4bc)

### Mark visibility of all vars and functions

Catching errors is easiest when no assumptions are made about visibility. It is best to mark every var and function with its visibility, even if it's the default. Any function, especially recursive ones like `calculateTokens`, should be marked `private` unless there's a compelling reason why the function should be inherited by sub-contracts or called from outside the contract. All vars and functions have been marked with an appropriate visibility.

```
 -  function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei) constant returns (bool) {
 +  function whitelistValidPurchase(address buyer, address beneficiary, uint256 amountWei) private constant returns (bool) {
```

```
 -  uint256 openWhitelistEndTime;
 +  uint256 public openWhitelistEndTime;
```

[diff](https://github.com/blockmason/tce-contracts/pull/2/commits/349b6074c365c1df3bb61685374ceb7fc80dba0c)

### Reorder functions in contracts by visibility

It is considered good Solidity style to order functions based on visibility. This is especially useful for users who want to find those functions which they could conceivably call, namely the external and public ones. See: http://solidity.readthedocs.io/en/develop/style-guide.html#order-of-functions

[diff](https://github.com/blockmason/tce-contracts/pull/2/commits/dffad3b4ac8a8b6ce38d9001d11f28f706c01db9)

### Improve order of function modifiers

"The visibility modifiers for a function should come before any custom modifiers" according to the [function declaration section of solidity's style guide](http://solidity.readthedocs.io/en/develop/style-guide.html#function-declaration). This convention was previously flouted by `transferableTokens` in `CPToken.sol`.

```
 -  function transferableTokens(address holder, uint64 time) constant public returns (uint256) {
 +  function transferableTokens(address holder, uint64 time) public constant returns (uint256) {
```

[diff](https://github.com/blockmason/tce-contracts/pull/2/commits/349b6074c365c1df3bb61685374ceb7fc80dba0c#diff-99f54dc08de0b03aaef6c389b12efb30L19)

### Fix oddities and redundancies in already-deployed `DPIcoWhitelist.sol`

The whitelist would ideally be nice and reject any transactions that attempt to call `signUp` with non-zero `msg.value`. This is a courtesy to those who might misread the instructions. The whitelist would ideally not implement its own `Ownable` features and instead use the functionality that's already in `zeppelin-solidity`'s `Ownable.sol`.

In `DPIcoWhitelist.sol`, there are many redundant functions. Vars, arrays and mappings, when public, automatically have getters created for them. The [solidity docs](http://solidity.readthedocs.io/en/develop/contracts.html#getter-functions) explain:

+ "The compiler automatically creates getter functions for all public state variables. For the contract given below, the compiler will generate a function called data that does not take any arguments and returns a uint, the value of the state variable data. The initialization of state variables can be done at declaration."
```
pragma solidity ^0.4.0;

contract C {
    uint public data = 42;
}

contract Caller {
    C c = new C();
    function f() {
        uint local = c.data();
    }
}
```

+ "The getter functions have external visibility. If the symbol is accessed internally (i.e. without this.), it is evaluated as a state variable. If it is accessed externally (i.e. with this.), it is evaluated as a function."

+ "It is possible to mark arrays public and have Solidity create a getter. The numeric index will become a required parameter for the getter."
    
+ "It is possible to mark mappings public and have Solidity create a getter. The _KeyType will become a required parameter for the getter and it will return _ValueType."

This information is ignored by this code from `DPIcoWhitelist.sol` which creates a redundant function `signUpOn`:

```
 bool public isOn;
```
```
 function signUpOn() public constant returns (bool) {
   return isOn;
 }
```

There are more examples of this throughout `DPIcoWhitelist.sol`.

## New Features

- Added tests for open whitelist period [diff](https://github.com/blockmason/tce-contracts/pull/2/commits/0475e89f4841dacbaeca9e5abbeac3230e43b107)

- Made the crowdsale contract's `buyTokens` function pausable by owner [diff_A](https://github.com/blockmason/tce-contracts/pull/4/commits/be5c6cc0afde7bb997d058b8454d1de0259a48cc) [diff_B](https://github.com/blockmason/tce-contracts/pull/4/commits/fd1c044ae431afc57be1534fb34baff82b8215e4)
  + added tests for pausing functionality

- Added mechanism to release tokens after sale ends [diff](https://github.com/blockmason/tce-contracts/pull/4/commits/0c63cded0b8db967160685c6ed976efba702eb89)
  + Before, tokens were released only after the crowdsale's `endTime`. Now
the tokens are released as soon as the crowdsale's `finalize` function
is called.
  + Added tests for token release after cap has been reached [diff](https://github.com/blockmason/tce-contracts/pull/4/commits/9e24689c6a0a97ee5751d675030cd34fd3671ba1)
    - Contracts passed test that owner (any non-crowdsale contract address) cannot call token `endSale` function
    - Contracts passed test that `finalize` properly calls `token.endSale`

## Further Recommendations

- Add something like this audit's overview section to the `README.md` so that potential investors and interested devs can understand the general structure of the contract and start reading the code
- Hard-code tiers values and `cap` so investors in crowdsale can be sure about how many tokens they'll receive per eth
- Transition to using 4 spaces per indent as opposed to 2, as [suggested by the solidity style guide](http://solidity.readthedocs.io/en/develop/style-guide.html#code-layout)
- Write additional tests of custom purchase tier functionality
- Write additional tests of custom whitelist and open whitelist period functionality
- Write additional tests with ethereum clients other than testrpc, e.g. `geth`, `parity`
