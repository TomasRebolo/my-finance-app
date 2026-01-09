import Snaptrade from "snaptrade-typescript-sdk";

// Initialize SnapTrade client with credentials from environment
const client = new Snaptrade({
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
});

export default client;

// Helper: Get or register a SnapTrade user
export async function getOrRegisterSnaptradeUser(userId: string) {
  try {
    // Try to get existing user first
    const response = await client.authentication.getUserJWT({
      userId,
    });
    return response.data;
  } catch (error: any) {
    // If user doesn't exist (404), register them
    if (error?.response?.status === 404) {
      const registerResponse = await client.authentication.registerSnapTradeUser({
        userId,
      });
      return registerResponse.data;
    }
    throw error;
  }
}
