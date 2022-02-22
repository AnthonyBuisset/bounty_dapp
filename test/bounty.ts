import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, assert } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import {
  BoredApe,
  BoredApe__factory,
  Bounty,
  BountyParticipation__factory,
  BountyRewardsClaimer,
  BountyRewardsClaimer__factory,
  Bounty__factory,
  ERC20BountyReward,
  ERC20BountyReward__factory,
  ERC721BountyReward,
  ERC721BountyReward__factory,
  FakeERC1155__factory,
  Tether,
  Tether__factory,
} from "../typechain";

describe("Bounty", () => {
  let participations: Contract,
    claimer: BountyRewardsClaimer,
    bounty: Bounty,
    erc20Reward: ERC20BountyReward,
    erc721Reward: ERC721BountyReward,
    usdt: Tether,
    nft: BoredApe,
    owner: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress;

  beforeEach(async () => {
    [owner, user, user2, user3] = await ethers.getSigners();

    participations = await new BountyParticipation__factory(owner).deploy();
    await participations.init("participations_metadata");
    claimer = await new BountyRewardsClaimer__factory(owner).deploy();
    await claimer.init(participations.address);
    bounty = await new Bounty__factory(owner).deploy();
    await bounty.init(
      "bounties_metadata",
      participations.address,
      claimer.address
    );
    erc20Reward = await new ERC20BountyReward__factory(owner).deploy();
    erc721Reward = await new ERC721BountyReward__factory(owner).deploy();
    usdt = await new Tether__factory(owner).deploy();
    nft = await new BoredApe__factory(owner).deploy();

    await nft.mint(owner.address);
  });

  it("should reject double bounty publications", async () => {
    const bountyId = 23;

    await usdt.increaseAllowance(erc20Reward.address, 200);

    await erc20Reward.createReward(usdt.address, 100);
    await erc20Reward.createReward(usdt.address, 100);
    await erc20Reward.setApprovalForAll(bounty.address, true);

    await bounty.createBounty(bountyId, erc20Reward.address, 0);
    await expect(
      bounty.createBounty(bountyId, erc20Reward.address, 1)
    ).to.be.revertedWith("Bounty: Bounty already published");
  });

  it("should reject double reward usage", async () => {
    const bountyId = 23;

    await usdt.increaseAllowance(erc20Reward.address, 200);

    await erc20Reward.createReward(usdt.address, 100);
    await erc20Reward.setApprovalForAll(bounty.address, true);

    await bounty.createBounty(bountyId, erc20Reward.address, 0);
    await expect(
      bounty.createBounty(bountyId + 1, erc20Reward.address, 0)
    ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
  });

  it("should reject unexpected ERC1155 token", async () => {
    const erc1155 = await new FakeERC1155__factory(owner).deploy();
    await erc1155.mint(0);
    await expect(erc1155.safeTransfer(bounty.address, 0)).to.be.revertedWith(
      "Bounty: Can only receive ERC1155 when initiated from this"
    );
  });

  it("should reject unexpected batch ERC1155 token", async () => {
    const erc1155 = await new FakeERC1155__factory(owner).deploy();
    await erc1155.mintBatch([0, 1]);
    await expect(
      erc1155.safeTransferBatch(bounty.address, [0, 1])
    ).to.be.revertedWith("ERC1155: ERC1155Receiver rejected tokens");
  });

  it("should allow user to participate to a bounty and claim ERC721 rewards", async () => {
    const bountyId = 23;
    const participationId = 32;

    // Publish bounty
    await nft.approve(erc721Reward.address, 0);
    await erc721Reward.createReward(nft.address, 0);
    await erc721Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bountyId, erc721Reward.address, 0);

    // List pending bounties
    const pendingBountiesBeforeApproval = await bounty.getPendingBounties();
    assert.exists(pendingBountiesBeforeApproval);
    assert.instanceOf(pendingBountiesBeforeApproval, Array);
    expect(pendingBountiesBeforeApproval.length).to.equal(1);
    expect(pendingBountiesBeforeApproval[0]).to.equal(bountyId);

    // Apply to the bounty
    await bounty.connect(user).participate(bountyId, participationId);
    expect(
      await participations.balanceOf(user.address, participationId)
    ).to.equal(1);

    // List participations
    const allParticipations = await bounty.listParticipations(bountyId);
    assert.exists(allParticipations);
    assert.instanceOf(allParticipations, Array);
    expect(allParticipations.length).to.equal(1);
    expect(allParticipations[0]).to.equal(participationId);

    // Approve participation
    await bounty.approveParticipation(bountyId, participationId);
    expect(await participations.isApproved(participationId)).to.equal(true);

    // List pending bounties
    const pendingBountiesAfterApproval = await bounty.getPendingBounties();
    assert.exists(pendingBountiesAfterApproval);
    assert.instanceOf(pendingBountiesAfterApproval, Array);
    expect(pendingBountiesAfterApproval.length).to.equal(0); // Bounty is no longer pending

    // Claim rewards
    await participations.connect(user).setApprovalForAll(bounty.address, true);
    await bounty.connect(user).claim(participationId);
    expect(await nft.balanceOf(user.address)).to.equal(1);
    expect(await nft.ownerOf(0)).to.equal(user.address);
  });

  it("should allow user to participate to a bounty and claim ERC20 rewards", async () => {
    const bountyId = 23;
    const participationId = 32;

    // Publish bounty
    await usdt.increaseAllowance(erc20Reward.address, 200);
    await erc20Reward.createReward(usdt.address, 200);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bountyId, erc20Reward.address, 0);

    // List pending bounties
    const pendingBountiesBeforeApproval = await bounty.getPendingBounties();
    assert.exists(pendingBountiesBeforeApproval);
    assert.instanceOf(pendingBountiesBeforeApproval, Array);
    expect(pendingBountiesBeforeApproval.length).to.equal(1);
    expect(pendingBountiesBeforeApproval[0]).to.equal(bountyId);

    // Apply to the bounty
    await bounty.connect(user).participate(bountyId, participationId);
    expect(
      await participations.balanceOf(user.address, participationId)
    ).to.equal(200);

    // List participations
    const allParticipations = await bounty.listParticipations(bountyId);
    assert.exists(allParticipations);
    assert.instanceOf(allParticipations, Array);
    expect(allParticipations.length).to.equal(1);
    expect(allParticipations[0]).to.equal(participationId);

    // Approve participation
    await bounty.approveParticipation(bountyId, participationId);
    expect(await participations.isApproved(participationId)).to.equal(true);

    // List pending bounties
    const pendingBountiesAfterApproval = await bounty.getPendingBounties();
    assert.exists(pendingBountiesAfterApproval);
    assert.instanceOf(pendingBountiesAfterApproval, Array);
    expect(pendingBountiesAfterApproval.length).to.equal(0); // Bounty is no longer pending

    // Claim rewards
    await participations.setApprovalForAll(bounty.address, true);
    await expect(bounty.claim(participationId)).to.be.revertedWith(
      "BountyRewardsClaimer: Insufficient balance"
    );

    await participations.connect(user).setApprovalForAll(bounty.address, true);
    await bounty.connect(user).claim(participationId);
    expect(await usdt.balanceOf(user.address)).to.equal(200);

    await expect(
      bounty.connect(user).claim(participationId)
    ).to.be.revertedWith("BountyRewardsClaimer: Insufficient balance");
  });

  it("should allow several contributors to participate to a bounty and claim ERC20 rewards", async () => {
    const bountyId = 23;
    const participationId = 32;

    // Publish bounty
    await usdt.increaseAllowance(erc20Reward.address, 200);
    await erc20Reward.createReward(usdt.address, 200);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bountyId, erc20Reward.address, 0);

    // Apply to the bounty
    await bounty
      .connect(user)
      .participateMulti(
        bountyId,
        participationId,
        [user.address, user2.address, user3.address],
        [100, 80, 20]
      );
    expect(
      await participations.balanceOf(user.address, participationId)
    ).to.equal(100);
    expect(
      await participations.balanceOf(user2.address, participationId)
    ).to.equal(80);
    expect(
      await participations.balanceOf(user3.address, participationId)
    ).to.equal(20);

    // Approve participation
    await bounty.approveParticipation(bountyId, participationId);
    expect(await participations.isApproved(participationId)).to.equal(true);

    // Claim rewards
    await participations.connect(user).setApprovalForAll(bounty.address, true);
    await participations.connect(user2).setApprovalForAll(bounty.address, true);
    await participations.connect(user3).setApprovalForAll(bounty.address, true);

    await bounty.connect(user).claim(participationId);
    await expect(
      bounty.connect(user).claim(participationId)
    ).to.be.revertedWith("BountyRewardsClaimer: Insufficient balance");
    await bounty.connect(user2).claim(participationId);
    await bounty.connect(user3).claim(participationId);
    expect(await usdt.balanceOf(user.address)).to.equal(100);
    expect(await usdt.balanceOf(user2.address)).to.equal(80);
    expect(await usdt.balanceOf(user3.address)).to.equal(20);
  });

  it("should should revert if reward dispatch is not correct", async () => {
    const bountyId = 23;
    const participationId = 32;

    // Publish bounty
    await usdt.increaseAllowance(erc20Reward.address, 200);
    await erc20Reward.createReward(usdt.address, 200);
    await erc20Reward.setApprovalForAll(bounty.address, true);
    await bounty.createBounty(bountyId, erc20Reward.address, 0);

    // Apply to the bounty with wrong dispatch
    await expect(
      bounty
        .connect(user)
        .participateMulti(
          bountyId,
          participationId,
          [user.address, user2.address, user3.address],
          [100, 80, 80]
        )
    ).to.be.revertedWith("Bounty: Invalid rewards dispatch");
    await expect(
      bounty
        .connect(user)
        .participateMulti(
          bountyId,
          participationId,
          [user.address, user2.address, user3.address],
          [100, 100]
        )
    ).to.be.revertedWith(
      "BountyParticipation: Invalid number of contributors or dispatch"
    );
  });
});
