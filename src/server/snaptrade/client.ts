import { Snaptrade } from "snaptrade-typescript-sdk";

// Initialize SnapTrade client with credentials from environment
const client = new Snaptrade({
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
});

export default client;

