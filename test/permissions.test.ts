import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'hardhat'
import { deployDiamond } from '../tasks'
import { MeemAdminFacet, MeemBaseFacet, MeemQueryFacet } from '../typechain'
import { meemMintData } from './helpers/meemProperties'
import { Chain, Permission, PermissionType } from './helpers/meemStandard'
import { zeroAddress } from './helpers/utils'

chai.use(chaiAsPromised)

describe('Minting Permissions', function Test() {
	let meemFacet: MeemBaseFacet
	let meemAdminFacet: MeemAdminFacet
	let queryFacet: MeemQueryFacet
	let signers: SignerWithAddress[]
	let contractAddress: string
	const owner = '0xde19C037a85A609ec33Fc747bE9Db8809175C3a5'
	const token0 = 100000
	const token1 = 100001
	const token2 = 100002
	// const token3 = 100003

	beforeEach(async () => {
		signers = await ethers.getSigners()
		console.log({ signers })
		const { DiamondProxy: DiamondAddress } = await deployDiamond({
			ethers
		})

		contractAddress = DiamondAddress

		meemFacet = (await ethers.getContractAt(
			'MeemBaseFacet',
			contractAddress
		)) as MeemBaseFacet

		meemAdminFacet = (await ethers.getContractAt(
			'MeemAdminFacet',
			contractAddress
		)) as MeemAdminFacet
		queryFacet = (await ethers.getContractAt(
			'MeemQueryFacet',
			contractAddress
		)) as MeemQueryFacet
	})

	async function mintZeroMeem() {
		const { status } = await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()
		assert.equal(status, 1)
	}

	it('Mints can not exceed childDepth', async () => {
		await mintZeroMeem()

		const { status } = await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()
		assert.equal(status, 1)

		const m1 = await queryFacet.getMeem(token1)
		assert.equal(m1.generation.toNumber(), 1)

		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token1,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token1,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)
	})

	it('Increases child depth and generation is updated properly', async () => {
		await mintZeroMeem()
		await (await meemAdminFacet.setChildDepth(2)).wait()

		// First gen
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		// Second gen
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token1,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		const m2 = await queryFacet.getMeem(token2)
		assert.equal(m2.generation.toNumber(), 2)

		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token2,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)
	})

	it('Respects total children', async () => {
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{ ...meemMintData, totalChildren: 1 },
				meemMintData
			)
		).wait()

		// Succeeds as first child
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{ ...meemMintData, totalChildren: 1 },
				meemMintData
			)
		).wait()

		// Fails as second child
		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{ ...meemMintData, totalChildren: 1 },
				meemMintData
			)
		)
	})

	it('Respects children per wallet', async () => {
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{ ...meemMintData, childrenPerWallet: 1 },
				meemMintData
			)
		).wait()

		// Succeeds as first child
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: signers[1].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		// Fails as second child per wallet
		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: signers[1].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)

		// Succeeds as different owner
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: signers[2].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()
	})

	it('Respects owner only minting', async () => {
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{
					...meemMintData,
					copyPermissions: [
						{
							permission: Permission.Owner,
							numTokens: 0,
							lockedBy: zeroAddress,
							addresses: []
						}
					]
				},
				meemMintData
			)
		).wait()

		// Succeeds as owner
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		// Fails as non-owner
		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: signers[1].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)
	})

	it('Respects address only minting', async () => {
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{
					...meemMintData,
					copyPermissions: [
						{
							permission: Permission.Addresses,
							numTokens: 0,
							lockedBy: zeroAddress,
							addresses: [signers[1].address]
						}
					]
				},
				meemMintData
			)
		).wait()

		// Succeeds as approved address
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: signers[1].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		// Fails as owner
		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)

		// Fails as other address
		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: signers[3].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)
	})

	it('Allows multiple permissions', async () => {
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: zeroAddress,
					parentTokenId: 0,
					rootChain: Chain.Polygon,
					root: zeroAddress,
					rootTokenId: 0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				{
					...meemMintData,
					copyPermissions: [
						{
							permission: Permission.Addresses,
							numTokens: 0,
							lockedBy: zeroAddress,
							addresses: [signers[1].address]
						},
						{
							permission: Permission.Owner,
							numTokens: 0,
							lockedBy: zeroAddress,
							addresses: []
						}
					]
				},
				meemMintData
			)
		).wait()

		// Succeeds as approved address
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: signers[1].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		// Succeeds as owner
		await (
			await meemFacet.connect(signers[0]).mint(
				{
					to: owner,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		).wait()

		// Fails as other address
		await assert.isRejected(
			meemFacet.connect(signers[0]).mint(
				{
					to: signers[3].address,
					mTokenURI:
						'https://raw.githubusercontent.com/meemproject/metadata/master/meem/1.json',
					parentChain: Chain.Polygon,
					parent: contractAddress,
					parentTokenId: token0,
					rootChain: Chain.Polygon,
					root: contractAddress,
					rootTokenId: token0,
					permissionType: PermissionType.Copy,
					data: ''
				},
				meemMintData,
				meemMintData
			)
		)
	})
})
