/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import type {
  AccessList,
  Authorization,
  AuthorizationRequest,
  BlockTag,
  Provider,
  Signer,
  TransactionLike,
  TransactionRequest,
  TypedDataDomain,
  TypedDataField,
} from "ethers";
import { TransactionResponse, Signature } from "ethers";
import type { SignTypedDataParameters, Address, Hex } from "viem";
import { toBigInt } from "ethers";

export class SignerWrapper implements Signer {
  constructor(
    private readonly legacyWallet: EVMSmartWallet,
    public provider: Provider | null = null
  ) {}

  static fromLegacyWallet(
    legacyWallet: EVMSmartWallet,
    provider?: Provider
  ): SignerWrapper {
    return new SignerWrapper(legacyWallet, provider);
  }

  connect(provider: null | Provider): Signer {
    return new SignerWrapper(this.legacyWallet, provider);
  }

  async getNonce(blockTag?: BlockTag): Promise<number> {
    if (!this.provider) {
      throw new Error("[SignerWrapper] Provider required for getNonce");
    }
    const address = this.legacyWallet.address;
    return this.provider.getTransactionCount(address, blockTag);
  }

  populateCall(_tx: TransactionRequest): Promise<TransactionLike<string>> {
    throw new Error("[SignerWrapper] Populate call not implemented.");
  }

  async populateTransaction(
    tx: TransactionRequest
  ): Promise<TransactionLike<string>> {
    if (!this.provider) {
      throw new Error(
        "[SignerWrapper] Provider required for populateTransaction"
      );
    }

    const populated = { ...tx };

    // Add from address if not present
    if (!populated.from) {
      populated.from = this.legacyWallet.address;
    }

    // Add chain ID if not present
    if (!populated.chainId) {
      const network = await this.provider.getNetwork();
      populated.chainId = network.chainId;
    }

    // Add nonce if not present
    if (populated.nonce == null) {
      populated.nonce = await this.getNonce();
    }

    // Estimate gas if not present
    if (!populated.gasLimit) {
      populated.gasLimit = await this.provider.estimateGas(populated);
    }

    return populated as TransactionLike<string>;
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    if (!this.provider) {
      throw new Error("[SignerWrapper] Provider required for estimateGas");
    }

    const txRequest = { ...tx };
    if (!txRequest.from) {
      txRequest.from = this.legacyWallet.address;
    }

    return this.provider.estimateGas(txRequest);
  }

  async call(tx: TransactionRequest): Promise<string> {
    if (!this.provider) {
      throw new Error("[SignerWrapper] Provider required for call");
    }

    const txRequest = { ...tx };
    if (!txRequest.from) {
      txRequest.from = this.legacyWallet.address;
    }

    return this.provider.call(txRequest);
  }

  resolveName(_name: string): Promise<null | string> {
    throw new Error("[SignerWrapper] Resolve name not implemented.");
  }

  signTransaction(_tx: TransactionRequest): Promise<string> {
    throw new Error("[SignerWrapper] Sign transaction not implemented.");
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    try {
      // Populate transaction if needed
      const populatedTx = await this.populateTransaction(tx);
      const txHash = await this.legacyWallet.client.wallet.sendTransaction({
        to: populatedTx.to as Address,
        value: populatedTx.value ? toBigInt(populatedTx.value) : 0n,
        data: (populatedTx.data as Hex) || "0x",
      });

      // Wait for the actual transaction receipt
      if (this.provider) {
        await this.provider.waitForTransaction(txHash);
        const transaction = await this.provider.getTransaction(txHash);
        if (transaction) {
          return transaction;
        }
      }

      return new TransactionResponse(
        {
          ...populatedTx,
          chainId: tx.chainId as bigint,
          accessList: tx.accessList as AccessList,
          to: tx.to as Address,
          value: tx.value as bigint,
          signature: new Signature(txHash, "0", "0", 27),
          hash: txHash,
          blockNumber: null,
          blockHash: null,
          from: tx.from as Address,
          index: 0,
          type: 0,
          nonce: 0,
          gasPrice: 0n,
          gasLimit: 0n,
          maxPriorityFeePerGas: 0n,
          maxFeePerGas: 0n,
          maxFeePerBlobGas: 0n,
          data: tx.data as Hex,
          authorizationList: [],
        },
        this.provider as Provider
      );
    } catch (error) {
      console.error("[SignerWrapper] Failed to send transaction:", error);
      throw error;
    }
  }

  signMessage(_message: string | Uint8Array): Promise<string> {
    // Convert ethers message to viem message
    // When message is a Uint8Array, it is a raw message
    const msg = _message instanceof Uint8Array ? { raw: _message } : _message;
    return this.legacyWallet.client.wallet.signMessage({
      message: msg,
    });
  }

  async signTypedData(
    _domain: TypedDataDomain,
    _types: Record<string, Array<TypedDataField>>,
    _value: Record<string, unknown>
  ): Promise<string> {
    // Convert ethers domain to viem domain
    const domain = {
      ...(_domain.name && { name: _domain.name }),
      ...(_domain.version && { version: _domain.version }),
      ...(_domain.chainId && { chainId: Number(_domain.chainId.toString()) }),
      ...(_domain.verifyingContract && {
        verifyingContract: _domain.verifyingContract as `0x${string}`,
      }),
      ...(_domain.salt && { salt: _domain.salt as `0x${string}` }),
    };

    // Convert ethers types to viem types
    // ethers TypedDataField[] needs to be converted to viem's format
    const types = Object.fromEntries(
      Object.entries(_types)
        .filter(([key]) => key !== "EIP712Domain")
        .map(([key, fields]) => [
          key,
          fields.map((field) => ({
            name: field.name,
            type: field.type,
          })),
        ])
    );

    // Sign with viem
    return this.legacyWallet.client.wallet.signTypedData({
      domain,
      types,
      primaryType: Object.keys(_types).find((t) => t !== "EIP712Domain") || "",
      message: _value,
    });
  }

  populateAuthorization(
    _auth: AuthorizationRequest
  ): Promise<AuthorizationRequest> {
    throw new Error("[SignerWrapper] Populate authorization not implemented.");
  }

  authorize(_authorization: AuthorizationRequest): Promise<Authorization> {
    throw new Error("[SignerWrapper] Authorize not implemented.");
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.legacyWallet.address);
  }
}
