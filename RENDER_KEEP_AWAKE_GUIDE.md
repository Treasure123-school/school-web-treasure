# 🔄 Keep Render Free Tier Backend Awake

## Problem
Render's free tier puts your backend to sleep after 15 minutes of inactivity, causing:
- Slow first page load (cold start ~30-60 seconds)
- Google OAuth delays

---

## ✅ Solution 1: Use a Ping Service (Recommended)

Use a **free cron job service** to ping your backend every 10-14 minutes:

### **Option A: Cron-job.org (Free, No Account Required)**

1. Go to [https://cron-job.org](https://cron-job.org)
2. Click "Create cronjob"
3. Configure:
   - **Title**: Keep Render Awake
   - **URL**: `https://treasure-home-backend.onrender.com/api/health`
   - **Schedule**: Every 10 minutes
   - **Enabled**: ✅
4. Save

### **Option B: UptimeRobot (Free, 50 monitors)**

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Create account (free)
3. Add New Monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Treasure Home Backend
   - **URL**: `https://treasure-home-backend.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes (free tier)
4. Create Monitor

### **Option C: EasyCron (Free tier available)**

1. Go to [https://www.easycron.com](https://www.easycron.com)
2. Create free account
3. Create cron job to ping your backend every 10 minutes

---

## ✅ Solution 2: Add Health Check Endpoint

First, ensure your backend has a health check endpoint. Add this to your Render backend:

**File: `server/routes.ts`** (if not exists already)

```typescript
// Health check endpoint for uptime monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## ✅ Solution 3: GitHub Actions (If you use GitHub)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Render Awake

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl https://treasure-home-backend.onrender.com/api/health
```

---

## ⚠️ Important Notes

1. **Render's Fair Use Policy**: Render allows reasonable keep-alive pings on free tier
2. **Don't ping too frequently**: 10-14 minutes is optimal (not every 1 minute)
3. **Use health endpoint**: Don't ping heavy routes that do database queries
4. **Battery life consideration**: The free tier may still spin down during low traffic hours

---

## 🎯 Recommended Setup

**Best Practice:**
- Use **UptimeRobot** or **Cron-job.org** (both are reliable and free)
- Ping every **10 minutes** to be safe
- Use `/api/health` endpoint (lightweight, no database queries)
- Monitor your Render usage to ensure compliance with free tier limits

---

## 📈 When to Upgrade

Consider upgrading to Render's paid tier ($7/month) if:
- You need guaranteed uptime
- Cold starts hurt user experience significantly  
- You're getting consistent traffic
- The free tier limitations impact your business

The ping services above will keep your backend responsive 24/7 for free! 🚀
