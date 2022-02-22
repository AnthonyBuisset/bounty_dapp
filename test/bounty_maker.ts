import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import {
  BoredApe,
  BoredApe__factory,
  BountyMaker,
  BountyMaker__factory,
  BountyParticipation__factory,
  BountyRewardsClaimer__factory,
  Bounty__factory,
  ERC20BountyReward__factory,
  ERC721BountyReward__factory,
  FakeERC1155__factory,
  IBounty__factory,
  IERC1155MetadataURI,
  IERC1155MetadataURI__factory,
  IERC1155__factory,
  Tether,
  Tether__factory,
} from "../typechain";

const createBountyRepository = async (
  bountyMaker: BountyMaker,
  dao: SignerWithAddress,
  bountyMetadataUri: string,
  participationsMetadataUri: string
) => {
  const repositoriesBefore = await bountyMaker.listAllRepositories();
  assert.exists(repositoriesBefore);
  assert.instanceOf(repositoriesBefore, Array);

  await bountyMaker
    .connect(dao)
    .createBountyRepository(bountyMetadataUri, participationsMetadataUri);
  const repositoriesAfter = await bountyMaker.listAllRepositories();

  assert.exists(repositoriesAfter);
  assert.instanceOf(repositoriesAfter, Array);

  expect(repositoriesAfter.length).to.equal(repositoriesBefore.length + 1);

  return repositoriesAfter[repositoriesAfter.length - 1];
};

const balance = async (token: any, owner: string) => {
  const balance = await token.balanceOf(owner);
  return balance.toNumber();
};

describe("BountyMaker", () => {
  let bountyMaker: BountyMaker,
    owner: SignerWithAddress,
    dao1: SignerWithAddress,
    usdt: Tether,
    nft: BoredApe,
    daoUsdtInitialBalance: number,
    daoNftInitialBalance: number;

  beforeEach(async () => {
    [owner, dao1] = await ethers.getSigners();
    const bounty = await new Bounty__factory(owner).deploy();
    const participations = await new BountyParticipation__factory(
      owner
    ).deploy();
    const claimer = await new BountyRewardsClaimer__factory(owner).deploy();
    const erc20Reward = await new ERC20BountyReward__factory(owner).deploy();
    const erc721Reward = await new ERC721BountyReward__factory(owner).deploy();

    bountyMaker = await new BountyMaker__factory(owner).deploy(
      bounty.address,
      claimer.address,
      participations.address,
      erc20Reward.address,
      erc721Reward.address
    );
    usdt = await new Tether__factory(owner).deploy();
    nft = await new BoredApe__factory(owner).deploy();

    await usdt.transfer(dao1.address, 1000);
    await nft.mint(dao1.address);

    daoUsdtInitialBalance = await balance(usdt, dao1.address);
    daoNftInitialBalance = await balance(nft, dao1.address);
  });

  it("should create a repository as ERC1155 with metdata URI", async () => {
    const repository = await createBountyRepository(
      bountyMaker,
      dao1,
      "bounties_metadata",
      "participations_metadata"
    );

    expect(
      await (
        await IERC1155MetadataURI__factory.connect(repository, dao1)
      ).uri(0)
    ).to.equal("bounties_metadata");
    expect(
      await (
        await IBounty__factory.connect(repository, dao1)
      ).getParticipationMetadataURI()
    ).to.equal("participations_metadata");
  });

  it("should reject unexpected ERC721 token", async () => {
    await expect(
      nft
        .connect(dao1)
        ["safeTransferFrom(address,address,uint256)"](
          dao1.address,
          bountyMaker.address,
          0
        )
    ).to.be.revertedWith(
      "BountyMaker: Can only receive ERC721 when initiated from this"
    );
  });

  it("should reject unexpected ERC1155 token", async () => {
    const erc1155 = await new FakeERC1155__factory(owner).deploy();
    await erc1155.mint(0);
    await expect(
      erc1155.safeTransfer(bountyMaker.address, 0)
    ).to.be.revertedWith(
      "BountyMaker: Can only receive ERC1155 when initiated from this"
    );
  });

  it("should reject unexpected batch ERC1155 token", async () => {
    const erc1155 = await new FakeERC1155__factory(owner).deploy();
    await erc1155.mintBatch([0, 1]);
    await expect(
      erc1155.safeTransferBatch(bountyMaker.address, [0, 1])
    ).to.be.revertedWith("ERC1155: ERC1155Receiver rejected tokens");
  });

  it("should publish a new bounty with ERC20 reward", async () => {
    const repository = await createBountyRepository(
      bountyMaker,
      dao1,
      "bounties_metadata",
      "participations_metadata"
    );
    const bountyId = 23;

    await usdt.connect(dao1).increaseAllowance(bountyMaker.address, 200);
    await bountyMaker
      .connect(dao1)
      .createBountyWithERC20Rewards(repository, bountyId, usdt.address, 200);

    const bounty = await IBounty__factory.connect(repository, dao1);
    const activeBounties = await bounty.getPendingBounties();

    assert.exists(activeBounties);
    assert.instanceOf(activeBounties, Array);
    expect(activeBounties.length).to.equal(1);
    expect(activeBounties[0]).to.equal(bountyId);

    const reward = await bounty.getReward(bountyId);
    const erc20Rewards = await IERC1155__factory.connect(reward[0], dao1);
    expect(await erc20Rewards.balanceOf(repository, reward[1])).to.equal(1);

    // Check ERC20 balance
    expect(await balance(usdt, dao1.address)).to.equal(
      daoUsdtInitialBalance - 200
    );
    expect(await balance(usdt, reward[0])).to.equal(200);
  });

  it("should publish a new bounty with ERC721 reward", async () => {
    const repository = await createBountyRepository(
      bountyMaker,
      dao1,
      "bounties_metadata",
      "participations_metadata"
    );
    const bountyId = 23;

    await nft.connect(dao1).approve(bountyMaker.address, 0);
    await bountyMaker
      .connect(dao1)
      .createBountyWithERC721Rewards(repository, bountyId, nft.address, 0);

    const bounty = await IBounty__factory.connect(repository, dao1);
    const activeBounties = await bounty.getPendingBounties();

    assert.exists(activeBounties);
    assert.instanceOf(activeBounties, Array);
    expect(activeBounties.length).to.equal(1);
    expect(activeBounties[0]).to.equal(bountyId);

    const reward = await bounty.getReward(bountyId);
    const erc721Rewards = await IERC1155__factory.connect(reward[0], dao1);
    expect(await erc721Rewards.balanceOf(repository, reward[1])).to.equal(1);

    // Check ERC721 balance
    expect(await balance(nft, dao1.address)).to.equal(daoNftInitialBalance - 1);
    expect(await balance(nft, reward[0])).to.equal(1);
    expect(await nft.ownerOf(0)).to.equal(reward[0]);
  });

  it("should support interfaces", async () => {
    expect(await bountyMaker.supportsInterface("0x00000000")).to.equal(false); // TODO check supported interfaces ?
  });
});
