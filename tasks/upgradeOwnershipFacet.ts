import { task, types } from 'hardhat/config'
import { FacetCutAction, getSelectors } from './lib/diamond'

type ContractName = 'Meem'

interface Contract {
	args?: (string | number | (() => string | undefined))[]
	address?: string
	libraries?: (() => Record<string, string>) | Record<string, string>
	waitForConfirmation?: boolean
}

task('upgradeOwnershipFacet', 'Upgrade OwnershipFacet')
	.addParam('proxy', 'The proxy address', undefined, types.string, false)
	.setAction(async (args, { ethers }) => {
		const [deployer] = await ethers.getSigners()
		console.log('Deploying contracts with the account:', deployer.address)

		console.log('Account balance:', (await deployer.getBalance()).toString())

		const OwnershipFacet = await ethers.getContractFactory('OwnershipFacet')
		const ownershipFacet = await OwnershipFacet.deploy()
		await ownershipFacet.deployed()

		const diamondCut = await ethers.getContractAt('IDiamondCut', args.proxy)
		const tx = await diamondCut.diamondCut(
			[
				{
					facetAddress: ownershipFacet.address,
					action: FacetCutAction.Replace,
					functionSelectors: getSelectors(ownershipFacet)
				}
			],
			ethers.constants.AddressZero,
			'0x',
			{ gasLimit: 5000000 }
		)
		console.log('Diamond cut tx:', tx.hash)
		const receipt = await tx.wait()
		if (!receipt.status) {
			throw Error(`Diamond upgrade failed: ${tx.hash}`)
		}
		console.log('Completed diamond cut: ', tx.hash)
	})