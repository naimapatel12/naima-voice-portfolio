# Deployment Guide for Custom Domain

This guide walks you through deploying your portfolio website to Netlify with a custom GoDaddy domain.

## Prerequisites

- ✅ GitHub repository set up
- ✅ GoDaddy domain name purchased
- Netlify account (will be created in steps below)

## Step-by-Step Deployment

### 1. Create Netlify Account and Connect GitHub

1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up" and choose "Sign up with GitHub" (easiest option)
3. Authorize Netlify to access your GitHub account
4. After logging in, click **"Add new site"** → **"Import an existing project"**
5. Select **"Deploy with GitHub"**
6. Find and select your `NaimaPatelVoicePortfolio` repository
7. Click **"Connect"**

### 2. Configure Netlify Build Settings

The `netlify.toml` file is already configured, but verify these settings:

- **Build command**: `npm run build` (already set in netlify.toml)
- **Publish directory**: `.` (root directory)
- Click **"Deploy site"**

**Note**: The first deployment may fail if `OPENAI_API_KEY` is not set yet. That's okay - we'll configure it in step 6.

### 3. Add Custom Domain in Netlify

1. After deployment completes, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name (e.g., `yourdomain.com`)
4. Click **"Verify"**
5. Netlify will show you the DNS records you need:
   - **A Record**: Points to Netlify's IP address (usually `75.2.60.5`)
   - **CNAME Record**: For www subdomain (points to your Netlify site URL, e.g., `your-site-name.netlify.app`)

### 4. Configure DNS in GoDaddy

1. Log into your [GoDaddy account](https://www.godaddy.com)
2. Go to **"My Products"** → Find your domain → Click **"DNS"**
3. You'll see your current DNS records. Update them:

   **A Record (for root domain)**:
   - **Name**: `@` (or leave blank/empty)
   - **Type**: `A`
   - **Value**: `75.2.60.5` (or the IP Netlify provides)
   - **TTL**: `600 seconds` (default)
   - Click **"Save"**

   **CNAME Record (for www subdomain)**:
   - **Name**: `www`
   - **Type**: `CNAME`
   - **Value**: Your Netlify site URL (e.g., `your-site-name.netlify.app`)
   - **TTL**: `600 seconds` (default)
   - Click **"Save"**

4. **Important**: If you have existing A or CNAME records for `@` or `www`, you may need to delete them first before adding the new ones.

### 5. Verify DNS Configuration in Netlify

1. Return to Netlify → **Domain management**
2. Click **"Verify DNS configuration"**
3. Netlify will automatically:
   - Verify your DNS records are correct
   - Provision an SSL certificate (Let's Encrypt)
   - Enable HTTPS

**Note**: DNS propagation can take 5 minutes to 48 hours, but usually completes within 15-30 minutes. You can check propagation status using tools like [whatsmydns.net](https://www.whatsmydns.net).

### 6. Configure Environment Variables

1. In Netlify, go to **Site settings** → **Environment variables**
2. Click **"Add variable"**
3. Add:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key
4. Click **"Save"**
5. Go to **Deploys** tab and click **"Trigger deploy"** → **"Clear cache and deploy site"** to rebuild with the new environment variable

### 7. Configure Domain Settings (Optional but Recommended)

1. In **Domain management**, set your **primary domain** (choose between `yourdomain.com` or `www.yourdomain.com`)
2. Enable **"Force HTTPS"** redirect
3. Enable **"HSTS"** for additional security

### 8. Test Your Deployment

1. Wait 5-15 minutes for DNS propagation (check with [whatsmydns.net](https://www.whatsmydns.net))
2. Visit your custom domain in a browser (e.g., `https://yourdomain.com`)
3. Verify:
   - ✅ Homepage loads correctly
   - ✅ All navigation links work
   - ✅ About page loads
   - ✅ Project pages load
   - ✅ Images and assets load properly
   - ✅ Voice navigation works (if API key is configured)
   - ✅ HTTPS is enabled (green lock icon)

## Troubleshooting

### DNS Not Working
- **Wait longer**: DNS can take up to 48 hours to fully propagate
- **Check records**: Verify DNS records in GoDaddy match exactly what Netlify shows
- **Clear DNS cache**: Try `nslookup yourdomain.com` or use [whatsmydns.net](https://www.whatsmydns.net)

### SSL Certificate Pending
- Usually takes 5-10 minutes after DNS verification
- Make sure DNS records are correct and propagated
- Check Netlify dashboard for any error messages

### Assets Not Loading
- Verify all file paths use relative paths (they do in this project)
- Check browser console for 404 errors
- Ensure files are committed to GitHub

### Environment Variables Not Working
- Make sure `OPENAI_API_KEY` is set in Netlify dashboard
- Trigger a new deployment after adding environment variables
- Check browser console for errors
- Verify `env-config.js` is generated (check Netlify build logs)

### Build Fails
- Check Netlify build logs for errors
- Ensure `package.json` is committed
- Verify Node.js version (Netlify uses Node 18 by default, which should work)

## Automatic Deployments

Netlify automatically deploys when you push to your GitHub repository's main branch. You can:
- View deployments in the **Deploys** tab
- Roll back to previous deployments if needed
- Configure branch deploys for previews

## Files Created for Deployment

- `netlify.toml` - Netlify configuration
- `package.json` - Build script configuration
- `scripts/build-env-config.js` - Build script that generates env-config.js
- `404.html` - Custom 404 error page
- `.gitignore` - Updated to exclude generated files

## Security Notes

- ✅ `env-config.js` is in `.gitignore` (won't be committed)
- ✅ API key is injected at build time, not stored in repository
- ✅ HTTPS is automatically enabled by Netlify
- ⚠️ The API key will be visible in the generated `env-config.js` file in the browser - this is necessary for client-side JavaScript. For production, consider using Netlify Functions as a proxy for better security.

## Expected Timeline

- Netlify setup: ~5 minutes
- DNS configuration: ~5 minutes
- DNS propagation: 5 minutes to 48 hours (usually 15-30 minutes)
- SSL certificate: 5-10 minutes after DNS verification
- **Total**: ~30 minutes to 1 hour for full setup

## Need Help?

- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Support](https://www.netlify.com/support)
- [GoDaddy DNS Help](https://www.godaddy.com/help)

