import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  BoredApe,
  BoredApe__factory,
  ERC721BountyReward__factory,
  IBountyReward,
} from "../typechain";

describe("ERC721BountyReward", function () {
  let owner: SignerWithAddress, nft: BoredApe, reward: IBountyReward;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    reward = await new ERC721BountyReward__factory(owner).deploy();
    nft = await new BoredApe__factory(owner).deploy();
  });

  it("should reject unexpected ERC721 token", async () => {
    await nft.mint(owner.address);
    await expect(
      nft["safeTransferFrom(address,address,uint256)"](
        owner.address,
        reward.address,
        0
      )
    ).to.be.revertedWith(
      "ERC721BountyReward: Can only receive ERC721 when initiated from this"
    );
  });
});
