# API Setup Guide

This guide shows you how to get free API keys for Ticketmaster and Eventbrite to power the Charlotte Concierge event aggregator.

## Why Use APIs?

✅ **Reliable dates and times** - No more parsing HTML
✅ **Structured data** - Venue addresses, prices, images included
✅ **Panthers/Hornets games** - Ticketmaster has all major sports
✅ **Better event coverage** - Hundreds of Charlotte events
✅ **Free tiers** - Both APIs are free for our usage

---

## 1. Ticketmaster Discovery API

**Get 5,000 free API calls/day** - Perfect for Panthers/Hornets games, concerts, and major events.

### Step 1: Create Ticketmaster Developer Account

1. Go to: https://developer.ticketmaster.com/
2. Click **"Get Your API Key"** or **"Sign Up"**
3. Fill out the registration form
4. Verify your email

### Step 2: Get Your API Key

1. Log in to: https://developer-acct.ticketmaster.com/user/login
2. Click **"Apps"** in the top navigation
3. Click **"Create New App"**
4. Fill in:
   - **App Name**: Charlotte Concierge
   - **Description**: Event aggregator for Charlotte, NC
5. Click **"Save"**
6. Your **Consumer Key** is your API key - copy it!

### Step 3: Add to .env File

```bash
TICKETMASTER_API_KEY=your_consumer_key_here
```

---

## 2. Eventbrite API

**Get free access** to thousands of Charlotte events with proper dates, venues, and details.

### Step 1: Create Eventbrite Account

1. Go to: https://www.eventbrite.com/
2. Sign up for a free account (if you don't have one)

### Step 2: Create an App & Get Private Token

1. Go to: https://www.eventbrite.com/platform/api
2. Click **"Create App"** (or go to https://www.eventbrite.com/account-settings/apps)
3. Fill in:
   - **Application Name**: Charlotte Concierge
   - **Application URL**: https://morganheinly08.github.io/charlotte-concierge/
   - **Application Description**: Event aggregator for Charlotte, NC
   - **Oath Redirect URI**: (leave as default)
4. Click **"Create Key"**
5. Under **"Your API Keys"**, you'll see:
   - **Private Token** - This is your API key - copy it!
   - (Don't use the Public/Anonymous token)

### Step 3: Add to .env File

```bash
EVENTBRITE_API_KEY=your_private_token_here
```

---

## 3. Setup .env File

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add both API keys:
   ```bash
   TICKETMASTER_API_KEY=K7nABc123XyZ456...
   EVENTBRITE_API_KEY=ABCD1234WXYZ5678...
   ```

3. **Save the file**

4. **Test the crawler**:
   ```bash
   npm run crawl
   ```

You should see output like:
```
✅ Ticketmaster API: Fetched 50+ events
✅ Eventbrite API: Fetched 100+ events
```

---

## 4. GitHub Actions Setup

To run the crawler automatically on GitHub Actions (weekly refresh):

1. Go to your GitHub repo: https://github.com/MorganHeinly08/charlotte-concierge
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add both secrets:

   **Secret 1:**
   - Name: `TICKETMASTER_API_KEY`
   - Value: Your Ticketmaster Consumer Key

   **Secret 2:**
   - Name: `EVENTBRITE_API_KEY`
   - Value: Your Eventbrite Private Token

5. Save both secrets

The weekly crawler will now use these API keys automatically!

---

## Troubleshooting

### "No API key found - skipping"
- Make sure your `.env` file exists
- Check that you copied the keys correctly (no extra spaces)
- Variable names must match exactly: `TICKETMASTER_API_KEY` and `EVENTBRITE_API_KEY`

### "Invalid API key"
- **Eventbrite**: Make sure you're using the **Private Token**, not the Public token
- **Ticketmaster**: Make sure you're using the **Consumer Key**, not the Secret

### "HTTP 401: Unauthorized"
- Your API key is invalid or has been revoked
- Go back to the developer portal and generate a new key

### Still no events?
- Check the crawler logs: `data/scrape-log-YYYY-MM-DD.json`
- Make sure the sources are enabled in `config/sources.json`
- Run `npm run crawl` to see real-time output

---

## API Limits

### Ticketmaster
- **Free Tier**: 5,000 API calls/day
- **Our Usage**: ~1 call per week (well within limits!)
- **Rate Limit**: 5 requests/second

### Eventbrite
- **Free Tier**: Rate limited but generous
- **Our Usage**: ~1 call per week
- **Rate Limit**: varies by account type

Both APIs are more than sufficient for weekly data refreshes!

---

## Next Steps

Once you have API keys set up:

1. Run `npm run crawl` locally to test
2. Check `data/latest.json` - you should see events with proper dates!
3. Run `npm run build` to build the site
4. Commit and push - GitHub Actions will use your repo secrets automatically

Enjoy reliable Charlotte event data! 🎉
