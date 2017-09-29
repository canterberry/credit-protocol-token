# CPToken Crowdsale (BCPT)

latest: 
- tx: ```0x87e91b1e225f09208d011dd95bddf033f255756b14e99b2072cfb55ff84aa6e5```
- contract: ```0x255d597951300a913d5e327c6e92ddc05923febe```
- token:    ```0x1c4481750daa5ff521a2a7490d9981ed46465dbd```
## Build steps
- In Remix
- 0.4.15 compiler, strict
- optimizations enabled
- 3737591 gas estimate

## Audit Reports
- [01 First Audit Report](audit01.md)
- [02 Second Audit Report](audit02.md)

## Solidity Compiler Config

- version: 0.4.15
- flags:

## Whitelist Mainnet Address
`0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602`

## Tiers Mainnet Address
`0x5e619b32e3b11023d7150792f30eb6ad6eab6f88`

## admin
`0x762662f1f663da61df057452ebe789066a6e3eb3`

## abi
```json
[{"constant":true,"inputs":[],"name":"getUsers","outputs":[{"name":"","type":"address[]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"numUsers","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"state","type":"bool"}],"name":"setSignUpOnOff","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"isSignedUp","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getAdmin","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"signUpOn","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"signUp","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"idx","type":"uint256"}],"name":"userAtIndex","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":false,"type":"fallback"}]
```
