const truffleAssert = require('truffle-assertions');

const BountyParticipation = artifacts.require("BountyParticipation");

contract("BountyParticipation", function (accounts) {

  const owner = accounts[0];
  let participations;

  beforeEach(async () => {
    participations = await BountyParticipation.new('metadata_uri');
  });

  it("should reject double participations", async () => {
    await participations.create(1, [owner], [1]);
    await truffleAssert.reverts(participations.create(1, [owner], [1]), "BountyParticipation: Participation already exists");
  });

  it("should reject approval of non-existing participations", async () => {
    await truffleAssert.reverts(participations.approve(1), "BountyParticipation: Participation does not exist");
  });
});
