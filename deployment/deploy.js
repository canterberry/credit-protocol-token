var twhitelistAddress = "0xdaF5520A1BA8D71CDb81C69c72D736dAb058C602";
var ttiersAddress = "0x5e619b32e3b11023d7150792f30eb6ad6eab6f88";
const owner = "0x4D8aC10E9AA9F78B6E5174371Ceb96Cb3630413B";

const twallet = "0xF617CC9DE7c4392D30dB54D7358719dd22C04eb8";
const tairdropWallet = "0x47Eb2be0E24b3e8a69Ff118aAe6A6dFEE05D4e37";
const tadvisorWallet = "0xDDD3CF3Ac1351D67214a50D2fbC889e5b860BC06";
const tstakingWallet = "0x3184d822758787a7fa82B032B678000FAf81FA4C";
const tprivateSaleWallet = "0x3bd170a319a1096dB90ba271B5266b79Eec6315b";

const tstartTime = 1506624898; //SET THIS
const tendTime   = tstartTime + 30*60; //30 mins
const twhitelistEndTime = tstartTime + 10*60; //10 mins
const topenWhitelistEndTime = tstartTime + 20*60; //20 mins
console.log(csInfo.contract_name);
var CPCrowdsale = web3.eth.contract(csInfo.abi);

var cpData = CPCrowdsale.new.getData(tstartTime, tendTime, twhitelistEndTime, topenWhitelistEndTime, twallet, ttiersAddress, twhitelistAddress, tairdropWallet, tadvisorWallet, tstakingWallet, tprivateSaleWallet, {from: owner, data: csInfo.unlinked_binary});
