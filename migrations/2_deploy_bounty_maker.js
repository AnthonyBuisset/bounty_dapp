const BountyMaker = artifacts.require("BountyMaker");

module.exports = function (deployer) {
  deployer.deploy(BountyMaker);
};
