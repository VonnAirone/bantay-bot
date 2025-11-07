# Bantay Barangay Bot

A Facebook Messenger bot for disaster reporting in Antique province, Philippines.

## Features

- Disaster report submission with location and emergency contacts
- Municipality-specific emergency hotlines for 18 Antique municipalities
- Admin dashboard for barangay officials
- Real-time report management and status updates
- Privacy policy and terms of service pages

## Deployment to Render.com

### 1. Push to GitHub

Make sure your code is pushed to a GitHub repository.

### 2. Connect to Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Choose the repository containing this bot

### 3. Configure Environment Variables

In the Render dashboard, add these environment variables:

- `VERIFY_TOKEN` - Your Facebook webhook verify token
- `PAGE_ACCESS_TOKEN` - Your Facebook Page Access Token
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase API key
- `NODE_ENV` - Set to "production"

### 4. Deploy Settings

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18+ (automatic)

### 5. Update Facebook Webhook

Once deployed, update your Facebook App webhook URL to:
`https://your-app-name.onrender.com/webhook`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your environment variables

3. Run development server:
   ```bash
   npm run dev
   ```

4. Use ngrok for webhook testing:
   ```bash
   ngrok http 3000
   ```

## Key Files

- `src/index.js` — Express app that registers the webhook
- `src/webhook.js` — Messenger handling and flows with Antique emergency contacts
- `src/adminApi.js` — Admin dashboard API endpoints
- `src/supabaseClient.js` — Supabase client wrapper
- `public/admin.html` — Admin dashboard interface
- `public/privacy.html` — Privacy policy page
- `public/terms.html` — Terms of service page

## Admin Dashboard

Access the admin dashboard at: `https://your-app-name.onrender.com/admin`

Features:
- View all disaster reports
- Filter by status and municipality
- Update report status
- View report statistics

## Database Schema

The bot uses Supabase with these tables:
- `users` — Store user information and conversation state
- `reports` — Store disaster reports with location and contact info

## Emergency Contacts

The bot includes emergency hotlines for all 18 municipalities in Antique:
- Anini-y, Barbaza, Belison, Bugasong, Caluya, Culasi, Hamtic, Laua-an
- Libertad, Pandan, Patnongon, San Jose, San Remigio, Sebaste, Sibalom, Tibiao, Tobias Fornier, Valderrama

## Privacy Policy & Terms

- Privacy Policy: `https://your-app-name.onrender.com/privacy`
- Terms of Service: `https://your-app-name.onrender.com/terms`
