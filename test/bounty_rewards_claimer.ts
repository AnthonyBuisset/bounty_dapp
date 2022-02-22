import {
  BountyParticipation__factory,
  BountyRewardsClaimer,
  BountyRewardsClaimer__factory,
  FakeERC1155__factory,
} from "../typechain";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

describe("BountyRewardsClaimer", () => {
  let claimer: BountyRewardsClaimer, owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const participations = await new BountyParticipation__factory(owner).deploy();
    await participations.init("participations_metadata");
    claimer = await new BountyRewardsClaimer__factory(owner).deploy();
    await claimer.init(participations.address);
  });

  it("should reject unexpected ERC1155 token", async () => {
    const erc1155 = await new FakeERC1155__factory(owner).deploy();
    await erc1155.mint(0);
    await expect(erc1155.safeTransfer(claimer.address, 0)).to.be.revertedWith(
      "BountyRewardsClaimer: Can only receive ERC1155 when initiated from this"
    );
  });

  it("should reject unexpected batch ERC1155 token", async () => {
    const erc1155 = await new FakeERC1155__factory(owner).deploy();
    await erc1155.mintBatch([0, 1]);
    await expect(
      erc1155.safeTransferBatch(claimer.address, [0, 1])
    ).to.be.revertedWith("ERC1155: ERC1155Receiver rejected tokens");
  });

  it("should support interfaces", async () => {
    expect(await claimer.supportsInterface("0x00000000")).to.equal(false); // TODO check supported interfaces ?
  });
});
