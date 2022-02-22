import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  BountyParticipation,
  BountyParticipation__factory,
} from "../typechain";

describe("BountyParticipation", () => {
  let owner: SignerWithAddress, participations: BountyParticipation;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    participations = await new BountyParticipation__factory(owner).deploy();
    await participations.init("metadata_uri");
  });

  it("should reject double participations", async () => {
    await participations.create(1, [owner.address], [1]);
    await expect(
      participations.create(1, [owner.address], [1])
    ).to.be.revertedWith("BountyParticipation: Participation already exists");
  });

  it("should reject approval of non-existing participations", async () => {
    await expect(participations.approve(1)).to.be.revertedWith(
      "BountyParticipation: Participation does not exist"
    );
  });
});
