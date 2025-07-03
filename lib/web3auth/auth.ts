export const parseToken = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace("-", "+").replace("_", "/");
    const jsonPayload =
      typeof window !== "undefined"
        ? window.atob(base64)
        : Buffer.from(base64, "base64").toString();
    return JSON.parse(jsonPayload || "");
  } catch (err) {
    console.error("Error while parsing token");
    throw err;
  }
};

export const validateJWTExpiration = (jwt: string): boolean => {
  try {
    const payload = parseToken(jwt);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      console.error("❌ JWT token has expired");
      return false;
    }

    // Check if token expires soon (within 5 minutes)
    if (payload.exp && payload.exp - now < 300) {
      console.warn("⚠️ JWT token expires soon (within 5 minutes)");
    }

    console.log("✅ JWT token is valid");
    return true;
  } catch (error) {
    console.error("❌ Error validating JWT:", error);
    return false;
  }
};
