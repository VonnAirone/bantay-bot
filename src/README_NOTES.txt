Developer notes:
- Conversation state is stored in-memory in `src/webhook.js` (convoState Map). Replace with persistent store for production.
- To fetch Facebook user name, call Graph API: https://graph.facebook.com/<PSID>?fields=first_name,last_name&access_token=<PAGE_ACCESS_TOKEN>
- Adjust webhook route path in Vercel (if using serverless functions, adapt code to /api/webhook handler).
