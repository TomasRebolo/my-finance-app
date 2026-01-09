# SnapTrade Integration Setup

## Environment Variables Required

Add these to your `.env` file:

```env
# SnapTrade Credentials
SNAPTRADE_CLIENT_ID=your_client_id_here
SNAPTRADE_CONSUMER_KEY=your_consumer_key_here
SNAPTRADE_REDIRECT_URI=http://localhost:3000/api/snaptrade/callback
```

## How to Use

1. **Connect a Brokerage Account**:
   - Click the "Connect Brokerage" button on the dashboard
   - You'll be redirected to SnapTrade's connection portal
   - Select your brokerage and sign in
   - After successful connection, you'll be redirected back to the dashboard

2. **Sync Your Portfolio**:
   - After connecting, click the "Sync" button to pull your latest holdings
   - This will import all your positions from connected brokerage accounts
   - Synced holdings will appear in your dashboard alongside manually added investments

3. **Import CSV (Alternative)**:
   - You can still use the "Import CSV" button for manual portfolio imports
   - This is useful for historical data or brokerages not supported by SnapTrade

## Features

- **Automatic Registration**: Users are automatically registered with SnapTrade on first connection
- **Read-Only Access**: By default, connections are read-only (no trading)
- **Multi-Account Support**: Connect multiple brokerage accounts
- **Real-time Sync**: Pull latest holdings on demand
- **Data Isolation**: SnapTrade holdings are tracked separately from manual entries

## Database Schema

The integration adds:
- `BrokerageConnection`: Tracks each connected brokerage
- `BrokerageAccount`: Individual accounts within a brokerage
- `Holding.brokerageAccountId`: Links holdings to their source account

## API Endpoints

- `POST /api/snaptrade/register`: Register user with SnapTrade
- `POST /api/snaptrade/connection-url`: Generate connection portal URL
- `GET /api/snaptrade/callback`: Handle post-connection redirect
- `POST /api/snaptrade/sync`: Sync portfolio data from SnapTrade
- `GET /api/snaptrade/connections`: List all brokerage connections
- `DELETE /api/snaptrade/connections`: Remove a connection

## Security Notes

- `SNAPTRADE_CONSUMER_KEY` is highly sensitive - never commit to version control
- User secrets are stored in the database (consider encrypting in production)
- All API calls require authentication via Clerk
