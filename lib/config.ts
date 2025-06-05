export const crossmintApiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY ?? "";
export const web3AuthClientId =
  process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "";
export const web3AuthNetwork = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK ?? "";
export const web3AuthVerifierId =
  process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER_ID ?? "";
export const chain = process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK ?? "";
export const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY ?? "";

// assert that all the variables are set
const values = [
  crossmintApiKey,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
  chain,
  pimlicoApiKey,
];

if (values.some((value) => !value)) {
  throw new Error(
    `Missing environment variables: ${values
      .filter((value) => !value)
      .join(", ")}`
  );
}
