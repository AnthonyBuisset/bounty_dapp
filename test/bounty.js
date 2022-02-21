const truffleAssert = require('truffle-assertions');

const Bounty = artifacts.require("Bounty");
const BountyParticipation = artifacts.require("BountyParticipation");
const BountyRewardsClaimer = artifacts.require("BountyRewardsClaimer");
const ERC20BountyReward = artifacts.require("ERC20BountyReward");
const ERC721BountyReward = artifacts.require("ERC721BountyReward");
const FakeERC1155 = artifacts.require("FakeERC1155");
const Tether = artifacts.require("Tether");
const BoredApe = artifacts.require("BoredApe");

contract("Bounty", function (accounts) {

  let participations;
  let claimer;
  let bounty;
  let erc20Reward;
  let erc721Reward;
  let usdt;
  let nft;

  const owner = accounts[0];
  const user = accounts[1];

  beforeEach(async () => {
    participations = await BountyParticipation.new('participations_metadata');
    claimer = await BountyRewardsClaimer.new(participations.address);
    bounty = await Bounty.new('bounties_metadata', participations.address, claimer.address);
    erc20Reward = await ERC20BountyReward.new();
    erc721Reward = await ERC721BountyReward.new();
    usdt = await Tether.new();
    nft = await BoredApe.new();

    await nft.mint(owner);
  });

  it("should reject double bounty publications", async () => {
    const bounty_id = 23;

    await usdt.increaseAllowance(erc20Reward.address, 200);

    await erc20Reward.createReward(usdt.address, 100);
    await erc20Reward.createReward(usdt.address, 100);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    
    await bounty.createBounty(bounty_id, erc20Reward.address, 0);
    await truffleAssert.reverts(bounty.createBounty(bounty_id, erc20Reward.address, 1), "Bounty: Bounty already published");
  });

  it("should reject double reward usage", async () => {
    const bounty_id = 23;

    await usdt.increaseAllowance(erc20Reward.address, 200);

    await erc20Reward.createReward(usdt.address, 100);
    await erc20Reward.setApprovalForAll(bounty.address, true);

    await bounty.createBounty(bounty_id, erc20Reward.address, 0);
    await truffleAssert.reverts(bounty.createBounty(bounty_id+1, erc20Reward.address, 0), "ERC1155: insufficient balance for transfer.");
  });

  it("should reject unexpected ERC1155 token", async () => {
    const erc1155 = await FakeERC1155.new();
    await erc1155.mint(0);
    await truffleAssert.reverts(erc1155.safeTransfer(bounty.address, 0), "Bounty: Can only receive ERC1155 when initiated from this");
  });

  it("should reject unexpected batch ERC1155 token", async () => {
    const erc1155 = await FakeERC1155.new();
    await erc1155.mintBatch([0,1]);
    await truffleAssert.reverts(erc1155.safeTransferBatch(bounty.address, [0,1]), "ERC1155: ERC1155Receiver rejected tokens");
  });

  it("should allow user to participate to a bounty and claim ERC721 rewards", async () => {
    const bounty_id = 23;
    const participation_id = 32;

    // Publish bounty
    await nft.approve(erc721Reward.address, 0);
    await erc721Reward.createReward(nft.address, 0);
    await erc721Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bounty_id, erc721Reward.address, 0);
    
    // List pending bounties
    const pending_bounties_before_approval = await bounty.getPendingBounties();
    assert.exists(pending_bounties_before_approval);
    assert.instanceOf(pending_bounties_before_approval, Array);
    assert.equal(pending_bounties_before_approval.length, 1);
    assert.equal(pending_bounties_before_approval[0], bounty_id);
    
    // Apply to the bounty
    await bounty.participate(bounty_id, participation_id, {from: user});
    assert.equal(await participations.balanceOf(user, participation_id), 1);
    
    // List participations
    const all_participations = await bounty.listParticipations(bounty_id);
    assert.exists(all_participations);
    assert.instanceOf(all_participations, Array);
    assert.equal(all_participations.length, 1);
    assert.equal(all_participations[0], participation_id);
    
    // Approve participation
    await bounty.approveParticipation(bounty_id, participation_id);
    assert.equal(await participations.isApproved(participation_id), true);
    
    // List pending bounties
    const pending_bounties_after_approval = await bounty.getPendingBounties();
    assert.exists(pending_bounties_after_approval);
    assert.instanceOf(pending_bounties_after_approval, Array);
    assert.equal(pending_bounties_after_approval.length, 0); // Bounty is no longer pending
    
    // Claim rewards
    await participations.setApprovalForAll(bounty.address, true, {from: user});
    await bounty.claim(participation_id, {from: user});
    assert.equal(await nft.balanceOf(user), 1);
    assert.equal(await nft.ownerOf(0), user);
  });

  it("should allow user to participate to a bounty and claim ERC20 rewards", async () => {
    const bounty_id = 23;
    const participation_id = 32;

    // Publish bounty
    await usdt.increaseAllowance(erc20Reward.address, 200);
    await erc20Reward.createReward(usdt.address, 200);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bounty_id, erc20Reward.address, 0);

    // List pending bounties
    const pending_bounties_before_approval = await bounty.getPendingBounties();
    assert.exists(pending_bounties_before_approval);
    assert.instanceOf(pending_bounties_before_approval, Array);
    assert.equal(pending_bounties_before_approval.length, 1);
    assert.equal(pending_bounties_before_approval[0], bounty_id);

    // Apply to the bounty
    await bounty.participate(bounty_id, participation_id, {from: user});
    assert.equal(await participations.balanceOf(user, participation_id), 200);

    // List participations
    const all_participations = await bounty.listParticipations(bounty_id);
    assert.exists(all_participations);
    assert.instanceOf(all_participations, Array);
    assert.equal(all_participations.length, 1);
    assert.equal(all_participations[0], participation_id);

    // Approve participation
    await bounty.approveParticipation(bounty_id, participation_id);
    assert.equal(await participations.isApproved(participation_id), true);

    // List pending bounties
    const pending_bounties_after_approval = await bounty.getPendingBounties();
    assert.exists(pending_bounties_after_approval);
    assert.instanceOf(pending_bounties_after_approval, Array);
    assert.equal(pending_bounties_after_approval.length, 0); // Bounty is no longer pending

    // Claim rewards
    await participations.setApprovalForAll(bounty.address, true);
    await truffleAssert.reverts(bounty.claim(participation_id), "BountyRewardsClaimer: Insufficient balance");

    await participations.setApprovalForAll(bounty.address, true, {from: user});
    await bounty.claim(participation_id, {from: user});
    assert.equal(await usdt.balanceOf(user), 200);

    await truffleAssert.reverts(bounty.claim(participation_id,  {from: user}), "BountyRewardsClaimer: Insufficient balance");
  });


  it("should allow several contributors to participate to a bounty and claim ERC20 rewards", async () => {
    const bounty_id = 23;
    const participation_id = 32;

    // Publish bounty
    await usdt.increaseAllowance(erc20Reward.address, 200);
    await erc20Reward.createReward(usdt.address, 200);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bounty_id, erc20Reward.address, 0);

    // Apply to the bounty
    const [user2, user3] = [accounts[2], accounts[3]];
    await bounty.participateMulti(bounty_id, participation_id, [user, user2, user3], [100, 80, 20], {from: user});
    assert.equal(await participations.balanceOf(user, participation_id), 100);
    assert.equal(await participations.balanceOf(user2, participation_id), 80);
    assert.equal(await participations.balanceOf(user3, participation_id), 20);

    // Approve participation
    await bounty.approveParticipation(bounty_id, participation_id);
    assert.equal(await participations.isApproved(participation_id), true);

    // Claim rewards
    await participations.setApprovalForAll(bounty.address, true, {from: user});
    await participations.setApprovalForAll(bounty.address, true, {from: user2});
    await participations.setApprovalForAll(bounty.address, true, {from: user3});

    await bounty.claim(participation_id, {from: user});
    await truffleAssert.reverts(bounty.claim(participation_id, {from: user}), "BountyRewardsClaimer: Insufficient balance");
    await bounty.claim(participation_id, {from: user2});
    await bounty.claim(participation_id, {from: user3});
    assert.equal(await usdt.balanceOf(user), 100);
    assert.equal(await usdt.balanceOf(user2), 80);
    assert.equal(await usdt.balanceOf(user3), 20);
  });

  it("should should revert if reward dispatch is not correct", async () => {
    const bounty_id = 23;
    const participation_id = 32;

    // Publish bounty
    await usdt.increaseAllowance(erc20Reward.address, 200);
    await erc20Reward.createReward(usdt.address, 200);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bounty_id, erc20Reward.address, 0);

    // Apply to the bounty with wrong dispatch
    const [user2, user3] = [accounts[2], accounts[3]];
    await truffleAssert.reverts(bounty.participateMulti(bounty_id, participation_id, [user, user2, user3], [100, 80, 80], {from: user}), "Bounty: Invalid rewards dispatch");
    await truffleAssert.reverts(bounty.participateMulti(bounty_id, participation_id, [user, user2, user3], [100, 100], {from: user}), "BountyParticipation: Invalid number of contributors or dispatch");
  });
});
