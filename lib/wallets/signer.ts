/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EVMSmartWallet } from "@crossmint/client-sdk-smart-wallet";
import type {
  Provider,
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import type { Address, Hex } from "viem";

export class SignerWrapper extends Signer {
  constructor(
    private readonly legacyWallet: EVMSmartWallet,
    readonly provider: Provider
  ) {
    super();
    this.provider = provider;
  }

  static fromLegacyWallet(
    legacyWallet: EVMSmartWallet,
    provider: Provider
  ): SignerWrapper {
    return new SignerWrapper(legacyWallet, provider);
  }

  connect(provider: Provider): Signer {
    return new SignerWrapper(this.legacyWallet, provider);
  }

  signTransaction(_tx: TransactionRequest): Promise<string> {
    throw new Error("[SignerWrapper] Sign transaction not implemented.");
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    try {
      console.log("[SignerWrapper] Sending transaction:", tx);
      const populatedTx = await this.populateTransaction(tx);
      console.log("[SignerWrapper] Populated transaction:", populatedTx);
      const txHash = await this.legacyWallet.client.wallet.sendTransaction({
        to: populatedTx.to as Address,
        value: populatedTx.value ? BigInt(populatedTx.value.toString()) : 0n,
        data: (populatedTx.data as Hex) || "0x",
      });

      // Wait for the actual transaction receipt
      await this.provider.waitForTransaction(txHash);
      return this.provider.getTransaction(txHash);
    } catch (error) {
      console.error("[SignerWrapper] Failed to send transaction:", error);
      throw error;
    }
  }

  async populateTransaction(
    tx: TransactionRequest
  ): Promise<TransactionRequest> {
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
      populated.nonce = await this.provider.getTransactionCount(
        populated.from as Address
      );
    }

    // Estimate gas if not present
    if (!populated.gasLimit) {
      populated.gasLimit = await this.provider.estimateGas(populated);
    }

    return populated as TransactionRequest;
  }

  signMessage(_message: string | Uint8Array): Promise<string> {
    // Convert ethers message to viem message
    // When message is a Uint8Array, it is a raw message
    const msg = _message instanceof Uint8Array ? { raw: _message } : _message;
    return this.legacyWallet.client.wallet.signMessage({
      message: msg,
    });
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.legacyWallet.address);
  }
}
