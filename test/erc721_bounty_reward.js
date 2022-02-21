const truffleAssert = require('truffle-assertions');

const BoredApe = artifacts.require("BoredApe");
const ERC721BountyReward = artifacts.require("ERC721BountyReward");

contract("ERC721BountyReward", function (accounts) {

  const owner = accounts[0];
  let nft;
  let reward;

  beforeEach(async () => {
    reward = await ERC721BountyReward.new();
    nft = await BoredApe.new();
  });

  it("should reject unexpected ERC721 token", async () => {
    await nft.mint(owner);
    await truffleAssert.reverts(nft.safeTransferFrom(owner, reward.address, 0), "ERC721BountyReward: Can only receive ERC721 when initiated from this");
  });
});
