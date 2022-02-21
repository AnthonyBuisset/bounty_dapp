const truffleAssert = require('truffle-assertions');

const BountyRewardsClaimer = artifacts.require("BountyRewardsClaimer");
const BountyParticipation = artifacts.require("BountyParticipation");
const FakeERC1155 = artifacts.require("FakeERC1155");

contract("BountyRewardsClaimer", function (accounts) {
  let claimer;

  beforeEach(async () => {
    const participations = await BountyParticipation.new('participations_metadata');
    claimer = await BountyRewardsClaimer.new(participations.address);
  });

  it("should reject unexpected ERC1155 token", async () => {
    const erc1155 = await FakeERC1155.new();
    await erc1155.mint(0);
    await truffleAssert.reverts(erc1155.safeTransfer(claimer.address, 0), "BountyRewardsClaimer: Can only receive ERC1155 when initiated from this");
  });

  it("should reject unexpected batch ERC1155 token", async () => {
    const erc1155 = await FakeERC1155.new();
    await erc1155.mintBatch([0,1]);
    await truffleAssert.reverts(erc1155.safeTransferBatch(claimer.address, [0,1]), "ERC1155: ERC1155Receiver rejected tokens");
  });

  it("should support interfaces", async () => {
    assert.equal(await claimer.supportsInterface("0x00000000"), false); // TODO check supported interfaces ?
  });

});
