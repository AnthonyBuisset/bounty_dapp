const truffleAssert = require('truffle-assertions');

const BountyMaker = artifacts.require("BountyMaker");

const Tether = artifacts.require("Tether");
const BoredApe = artifacts.require("BoredApe");

const IBounty = artifacts.require("IBounty");
const FakeERC1155 = artifacts.require("FakeERC1155");

const IERC1155 = artifacts.require("IERC1155");
const IERC1155MetadataURI = artifacts.require("IERC1155MetadataURI");

const createBountyRepository = async (bounty_maker, dao, bounty_metadata_uri, participations_metadata_uri) => {
  const repositories_before = await bounty_maker.listAllRepositories();    
  assert.exists(repositories_before);
  assert.instanceOf(repositories_before, Array);

  await bounty_maker.createBountyRepository(bounty_metadata_uri, participations_metadata_uri, {from: dao}); 
  const repositories_after = await bounty_maker.listAllRepositories();
  
  assert.exists(repositories_after);
  assert.instanceOf(repositories_after, Array);

  assert.equal(repositories_after.length, repositories_before.length+1);

  return repositories_after[repositories_after.length-1];
};

const balance = async (token, owner) => {
  const balance = await token.balanceOf(owner);
  return balance.toNumber();
};

contract("BountyMaker", function (accounts) {

  let bounty_maker;
  const dao1 = accounts[1];
  let usdt;
  let nft;
  let dao_usdt_initial_balance;
  let dao_nft_initial_balance;

  beforeEach(async () => {
    bounty_maker = await BountyMaker.deployed();
    usdt = await Tether.new();
    nft = await BoredApe.new();

    await usdt.transfer(dao1, 1000);
    await nft.mint(dao1);

    dao_usdt_initial_balance = await balance(usdt, dao1);
    dao_nft_initial_balance = await balance(nft, dao1);
  });

  it("should create a repository as ERC1155 with metdata URI", async () => {
    const repository = await createBountyRepository(bounty_maker, dao1, 'bounties_metadata', 'participations_metadata'); 
    assert.equal(await (await IERC1155MetadataURI.at(repository)).uri(0), 'bounties_metadata');
    assert.equal(await (await IBounty.at(repository)).getParticipationMetadataURI(), 'participations_metadata');
  });

  it("should reject unexpected ERC721 token", async () => {
    await truffleAssert.reverts(nft.safeTransferFrom(dao1, bounty_maker.address, 0, {from: dao1}), "BountyMaker: Can only receive ERC721 when initiated from this");
  });

  it("should reject unexpected ERC1155 token", async () => {
    const erc1155 = await FakeERC1155.new();
    await erc1155.mint(0);
    await truffleAssert.reverts(erc1155.safeTransfer(bounty_maker.address, 0), "BountyMaker: Can only receive ERC1155 when initiated from this");
  });

  it("should reject unexpected batch ERC1155 token", async () => {
    const erc1155 = await FakeERC1155.new();
    await erc1155.mintBatch([0,1]);
    await truffleAssert.reverts(erc1155.safeTransferBatch(bounty_maker.address, [0,1]), "ERC1155: ERC1155Receiver rejected tokens");
  });

  it("should publish a new bounty with ERC20 reward", async () => {
    const repository = await createBountyRepository(bounty_maker, dao1, 'bounties_metadata', 'participations_metadata'); 
    const bounty_id = 23;

    await usdt.increaseAllowance(bounty_maker.address, 200, {from: dao1});
    await bounty_maker.createBountyWithERC20Rewards(repository, bounty_id, usdt.address, 200, {from: dao1});

    const bounty = await IBounty.at(repository);
    const active_bounties = await bounty.getPendingBounties();

    assert.exists(active_bounties);
    assert.instanceOf(active_bounties, Array);
    assert.equal(active_bounties.length, 1);
    assert.equal(active_bounties[0], bounty_id);

    const reward = await bounty.getReward(bounty_id);
    const erc20Rewards = await IERC1155.at(reward[0]);
    assert.equal(await erc20Rewards.balanceOf(repository, reward[1]), 1);

    // Check ERC20 balance
    assert.equal(await balance(usdt, dao1), dao_usdt_initial_balance-200);
    assert.equal(await balance(usdt, reward[0]), 200);
  });

  it("should publish a new bounty with ERC721 reward", async () => {
    const repository = await createBountyRepository(bounty_maker, dao1, 'bounties_metadata', 'participations_metadata'); 
    const bounty_id = 23;

    await nft.approve(bounty_maker.address, 0, {from: dao1});
    await bounty_maker.createBountyWithERC721Rewards(repository, bounty_id, nft.address, 0, {from: dao1});

    const bounty = await IBounty.at(repository);
    const active_bounties = await bounty.getPendingBounties();

    assert.exists(active_bounties);
    assert.instanceOf(active_bounties, Array);
    assert.equal(active_bounties.length, 1);
    assert.equal(active_bounties[0], bounty_id);

    const reward = await bounty.getReward(bounty_id);
    const erc721Rewards = await IERC1155.at(reward[0]);
    assert.equal(await erc721Rewards.balanceOf(repository, reward[1]), 1);

    // Check ERC721 balance
    assert.equal(await balance(nft, dao1), dao_nft_initial_balance-1);
    assert.equal(await balance(nft, reward[0]), 1);
    assert.equal(await nft.ownerOf(0), reward[0]);
  });

  it("should support interfaces", async () => {
    assert.equal(await bounty_maker.supportsInterface("0x00000000"), false); // TODO check supported interfaces ?
  });

});
