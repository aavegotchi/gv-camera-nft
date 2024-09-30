# Aavegotchi Gaming Console (AGC) and GOTCHI Points (GP) Diamond Contracts

## Installation

1. Clone this repo:

```console
git clone git@github.com:aavegotchi/agc-contracts.git
```

2. Install NPM packages:

```console
cd agc-contracts
npm install
```

## Deployment

```console
npx hardhat run scripts/deploy/deploy.ts
```

This will deploy both the AGC and GP diamonds, as well as set the GP diamond address in the AGC diamond.

All of the other parameters such as AGC admins, the default wheel weights and points, and initial season max points are set in the constructor of the diamonds.

## Configuration

- AGC admins: These are the addresses that can call the addBadge and mintBadge functions in the AGC diamond.
- Default wheel weights: These are the weights of the wheel.
- Default wheel points: These are the points of the wheel.
- Initial season max points: This is the maximum number of points that can be earned in the initial season of the GOTCHI points campaign.

## Run tests:

```console
npx hardhat test
```

## Upgrade a diamond

Check the `scripts/deploy.js` and or the `test/diamondTest.js` file for examples of upgrades.

Note that upgrade functionality is optional. It is possible to deploy a diamond that can't be upgraded, which is a 'Single Cut Diamond'. It is also possible to deploy an upgradeable diamond and at a later date remove its `diamondCut` function so it can't be upgraded any more.

Note that any number of functions from any number of facets can be added/replaced/removed on a diamond in a single transaction. In addition an initialization function can be executed in the same transaction as an upgrade to initialize any state variables required for an upgrade. This 'everything done in a single transaction' capability ensures a diamond maintains a correct and consistent state during upgrades.

## Calling Diamond Functions

In order to call a function that exists in a diamond you need to use the ABI information of the facet that has the function.

Here is an example that uses web3.js:

```javascript
let myUsefulFacet = new web3.eth.Contract(MyUsefulFacet.abi, diamondAddress);
```

In the code above we create a contract variable so we can call contract functions with it.

In this example we know we will use a diamond because we pass a diamond's address as the second argument. But we are using an ABI from the MyUsefulFacet facet so we can call functions that are defined in that facet. MyUsefulFacet's functions must have been added to the diamond (using diamondCut) in order for the diamond to use the function information provided by the ABI of course.

Similarly you need to use the ABI of a facet in Solidity code in order to call functions from a diamond. Here's an example of Solidity code that calls a function from a diamond:

```solidity
string result = MyUsefulFacet(address(diamondContract)).getResult()
```

## Get Help and Join the Community

If you need help or would like to discuss diamonds then send me a message [on twitter](https://twitter.com/mudgen), or [email me](mailto:nick@perfectabstractions.com). Or join the [EIP-2535 Diamonds Discord server](https://discord.gg/kQewPw2).

## Useful Links

1. [Introduction to the Diamond Standard, EIP-2535 Diamonds](https://eip2535diamonds.substack.com/p/introduction-to-the-diamond-standard)
1. [EIP-2535 Diamonds](https://github.com/ethereum/EIPs/issues/2535)
1. [Understanding Diamonds on Ethereum](https://dev.to/mudgen/understanding-diamonds-on-ethereum-1fb)
1. [Solidity Storage Layout For Proxy Contracts and Diamonds](https://medium.com/1milliondevs/solidity-storage-layout-for-proxy-contracts-and-diamonds-c4f009b6903)
1. [New Storage Layout For Proxy Contracts and Diamonds](https://medium.com/1milliondevs/new-storage-layout-for-proxy-contracts-and-diamonds-98d01d0eadb)
1. [Upgradeable smart contracts using the Diamond Standard](https://hiddentao.com/archives/2020/05/28/upgradeable-smart-contracts-using-diamond-standard)
1. [buidler-deploy supports diamonds](https://github.com/wighawag/buidler-deploy/)

## Credit

EIP2535 Diamonds was written by Nick Mudge.

Contact:

- https://twitter.com/mudgen
- nick@perfectabstractions.com

## License

MIT license. See the license file.
Anyone can use or modify this software for their purposes.
