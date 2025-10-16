import type { Chain } from "@crossmint/wallets-sdk";

export const crossmintLegacyApiKey =
  process.env.NEXT_PUBLIC_CROSSMINT_API_LEGACY_KEY ?? "";
export const crossmintApiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY ?? "";
export const web3AuthClientId =
  process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "";
export const web3AuthNetwork = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK ?? "";
export const web3AuthVerifierId =
  process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER_ID ?? "";
export const chain = (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK ??
  "polygon") as Chain;

// optional
export const openseaApiKey = process.env.NEXT_PUBLIC_OPENSEA_API_KEY ?? "";
export const elementApiKey = process.env.NEXT_PUBLIC_ELEMENT_API_KEY ?? "";
export const polygonAlchemyRpcUrl = process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_RPC_URL ?? "";

// assert that all the variables are set
const values = [
  crossmintLegacyApiKey,
  crossmintApiKey,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
  chain,
];

if (values.some((value) => !value)) {
  throw new Error(
    `Missing environment variables: ${values
      .filter((value) => !value)
      .join(", ")}`
  );
}
