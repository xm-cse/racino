// Legacy Project Configuration
export const crossmintApiKeyLegacy = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY_LEGACY ?? "";

// Latest SDK Project Configuration
export const crossmintApiKeyLatest = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY_LATEST ?? "";

// Web3Auth Configuration
export const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "";
export const web3AuthNetwork = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK ?? "";
export const web3AuthVerifierId = process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER_ID ?? "";

// Chain Configuration
export const legacyChain = process.env.NEXT_PUBLIC_LEGACY_CHAIN ?? "polygon-amoy";
export const latestChain = process.env.NEXT_PUBLIC_LATEST_CHAIN ?? "curtis";

// Amazon Cognito Configuration (Optional for now)
export const cognitoUserPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
export const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
export const cognitoRegion = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "";

// Backward compatibility - use legacy as default
export const crossmintApiKey = crossmintApiKeyLegacy;

// Validation - Only require essential variables that are actually used
const requiredValues = [
  crossmintApiKeyLegacy,
  crossmintApiKeyLatest,
  web3AuthClientId,
  web3AuthNetwork,
  web3AuthVerifierId,
  legacyChain,
  latestChain,
];

if (requiredValues.some((value) => !value)) {
  throw new Error(
    `Missing environment variables: ${requiredValues
      .filter((value) => !value)
      .join(", ")}`
  );
}
