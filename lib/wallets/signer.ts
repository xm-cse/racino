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
import type { Address, Hex } from "viem";

export class SignerWrapper implements Signer {
  constructor(
    private readonly legacyWallet: EVMSmartWallet,
    public provider: Provider | null = null
  ) {}

  static fromLegacyWallet(legacyWallet: EVMSmartWallet): SignerWrapper {
    return new SignerWrapper(legacyWallet);
  }

  connect(_provider: null | Provider): Signer {
    throw new Error("[SignerWrapper] Connect not implemented.");
  }

  getNonce(_blockTag?: BlockTag): Promise<number> {
    throw new Error("[SignerWrapper] Get nonce not implemented.");
  }

  populateCall(_tx: TransactionRequest): Promise<TransactionLike<string>> {
    throw new Error("[SignerWrapper] Populate call not implemented.");
  }

  populateTransaction(
    _tx: TransactionRequest
  ): Promise<TransactionLike<string>> {
    throw new Error("[SignerWrapper] Populate transaction not implemented.");
  }

  estimateGas(_tx: TransactionRequest): Promise<bigint> {
    throw new Error("[SignerWrapper] Estimate gas not implemented.");
  }

  call(_tx: TransactionRequest): Promise<string> {
    throw new Error("[SignerWrapper] Call not implemented.");
  }

  resolveName(_name: string): Promise<null | string> {
    throw new Error("[SignerWrapper] Resolve name not implemented.");
  }

  signTransaction(_tx: TransactionRequest): Promise<string> {
    throw new Error("[SignerWrapper] Sign transaction not implemented.");
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    const txHash = await this.legacyWallet.client.wallet.sendTransaction({
      to: tx.to as Address,
      value: tx.value as bigint,
      data: tx.data as Hex,
    });

    return new TransactionResponse(
      {
        ...tx,
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
  }

  signMessage(_message: string | Uint8Array): Promise<string> {
    throw new Error("[SignerWrapper] Sign message not implemented.");
  }

  signTypedData(
    _domain: TypedDataDomain,
    _types: Record<string, Array<TypedDataField>>,
    _value: Record<string, unknown>
  ): Promise<string> {
    throw new Error("[SignerWrapper] Sign typed data not implemented.");
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
    return Promise.resolve(this.legacyWallet.client.wallet.getAddress());
  }
}
