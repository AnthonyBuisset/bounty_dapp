# Bounty dApp

### BountyMaker

* is the main entrance for DAO
* Can list all bounty repositories
* DAO can register to create new Bounty repository with dedicated metdata URI
* DAO can use dashboard to list active bounties + #Applications + # of contributors + status (ready for review)
* High gas fees 1-time payment upon repository creation
* Low gas fees for bounties publications/participations

### Bounty

* is an ERC1155
* Is owner of the BountyReward token (prevent double usage of reward)
* Metadata to describe bounty, localized metadata for bounty translation in several languages
* Metadata are stored in distributed file storage (IPFS, Filecoin, ...)
* Metadata describes the work requested

### BountyReward

* is an ERC1155
* hides the logic of minting/transfer
* mint as may tokens as in underlying reward
* be able to disptach rewards to several contributors
* allow rewards in ERC20, ERC721, ERC1155, ... (GameFi)

### BountyApplication

* is an ERC1155
* mint as many tokens as in dispatch

### ReardsClaimer

* Holds the information of which application is approved
* has the burner role to burn participations upon reward claiming
* isApprovedForAll() on rewards to transfer rewards to contributors

### Oracle

* Oracle can update status of applications on-chain based on PR status on github (optional)
* Could be useful to list all bounties that are ready for review (with PR merged)

### Other ideas

* Use [Factory pattern](https://betterprogramming.pub/learn-solidity-the-factory-pattern-75d11c3e7d29) to save gas&#x20;
* Check for reentrancy attack vulnerability
* Metadata should be protected to prevent alteration
* Tokens burning ? (rewards claimed, application rejected, bounty validated)
* Less fees if use $DUST as rewards ?
* Give up on a bounty ?
  * Refund the DAO
  * Pay the contributors (for time wasted)
* Voting system on contributions ?
* Secure against front-running (stealing ownership of application)&#x20;
* Check for duplicate applications
* Meta transactions (gasless) to apply for a bounty / claim rewards => [EIP-712](https://eips.ethereum.org/EIPS/eip-712)

