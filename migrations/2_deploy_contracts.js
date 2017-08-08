var DPW = artifacts.require("./DPIcoWhitelist.sol");

module.exports = function(deployer) {
    deployer.deploy(DPW);
//  deployer.deploy(ConvertLib);
//  deployer.link(ConvertLib, MetaCoin);
//  deployer.deploy(MetaCoin);
};
