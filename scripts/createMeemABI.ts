import path from 'path'
import fs from 'fs-extra'
import accessControlABI from '../abi/contracts/Meem/facets/AccessControlFacet.sol/AccessControlFacet.json'
import erc721ABI from '../abi/contracts/Meem/facets/ERC721Facet.sol/ERC721Facet.json'
import meemAdminABI from '../abi/contracts/Meem/facets/MeemAdminFacet.sol/MeemAdminFacet.json'
import meemBaseABI from '../abi/contracts/Meem/facets/MeemBaseFacet.sol/MeemBaseFacet.json'
import meemPermissionsABI from '../abi/contracts/Meem/facets/MeemPermissionsFacet.sol/MeemPermissionsFacet.json'
import meemQueryABI from '../abi/contracts/Meem/facets/MeemQueryFacet.sol/MeemQueryFacet.json'
import meemSplitsABI from '../abi/contracts/Meem/facets/MeemSplitsFacet.sol/MeemSplitsFacet.json'
import meemDiamondABI from '../abi/contracts/MeemDiamond.sol/MeemDiamond.json'

const combinedABI = [
	...accessControlABI,
	...erc721ABI,
	...meemAdminABI,
	...meemBaseABI,
	...meemPermissionsABI,
	...meemQueryABI,
	...meemSplitsABI,
	...meemDiamondABI
]

fs.writeFileSync(
	path.join(process.cwd(), 'types', 'Meem.json'),
	JSON.stringify(combinedABI)
)
