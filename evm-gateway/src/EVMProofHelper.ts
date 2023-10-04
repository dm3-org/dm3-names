import { ethers } from 'ethers';

/**
 * Response of the eth_getProof RPC method.
 */
interface EthGetProofResponse {
    accountProof: string[];
    balance: string;
    codeHash: string;
    nonce: string;
    storageHash: string;
    storageProof: {
        key: string;
        value: string;
        proof: string[];
    }[];
}

export interface StateProof {
    stateTrieWitness: string;
    storageProofs: string[];
}

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class EVMProofHelper {
    private readonly provider: ethers.JsonRpcProvider;

    constructor(provider: ethers.JsonRpcProvider) {
        this.provider = provider;
    }

    /**
     * @dev Returns the value of a contract state slot at the specified block
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slot The slot to fetch.
     * @returns The value in `slot` of `address` at block `block`
     */
    getStorageAt(block: number, address: ethers.AddressLike, slot: bigint): Promise<string> {
        return this.provider.getStorage(address, slot, block);
    }

    /**
     * @dev Fetches a set of proofs for the requested state slots.
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slots An array of slots to fetch data for.
     * @returns A proof of the given slots, encoded in a manner that this service's
     *   corresponding decoding library will understand.
     */
    async getProofs(blockNo: number, address: ethers.AddressLike, slots: bigint[]): Promise<StateProof> {
        const args = [address, slots.map((slot) => ethers.toBeHex(slot, 32)), ethers.toBeHex(blockNo)];
        const proofs: EthGetProofResponse = await this.provider.send(
            'eth_getProof',
            args
        );
        return {
            stateTrieWitness: ethers.encodeRlp(proofs.accountProof),
            storageProofs: proofs.storageProof.map((proof) => ethers.encodeRlp(proof.proof)),
        };
    }
}