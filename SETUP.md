# Deployment Setup

## 1. Railway Environment Variables (Task 8.2)

In the Railway dashboard for this service, set:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string from Railway Postgres plugin |
| `LINE_CHANNEL_ACCESS_TOKEN` | From Line Developer Console → your channel |
| `LINE_CHANNEL_SECRET` | From Line Developer Console → your channel |
| `LINE_USER_ID` | Your Line user ID (use the Line API to look it up) |
| `BASE_URL` | Your Railway app URL, e.g. `https://your-app.up.railway.app` |

## 2. Run Database Migration

After configuring `DATABASE_URL`:

```bash
npx prisma migrate dev --name init
```

## 3. Line Bot Webhook URL (Task 8.3)

In Line Developer Console → your Messaging API channel → Webhook settings:

- Webhook URL: `https://[BASE_URL]/api/linebot/webhook`
- Use webhook: ON
- Webhook redelivery: ON (optional)

Test the connection using the "Verify" button in the console.

## 4. Install Playwright Browsers

```bash
npx playwright install chromium
```
