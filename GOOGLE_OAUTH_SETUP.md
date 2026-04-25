# Google OAuth Integration Guide

Your Travel Buddy app is already configured for Google OAuth! Follow these steps to set it up:

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project:
   - Click the project dropdown at the top
   - Click "NEW PROJECT"
   - Name it "Travel Buddy"
   - Click "CREATE"

3. Enable Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click on it and press **ENABLE**

4. Create OAuth Consent Screen:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Select **External** user type
   - Click **CREATE**
   - Fill in the form:
     - App name: Travel Buddy
     - User support email: your@email.com
     - Developer contact: your@email.com
   - Click **SAVE AND CONTINUE**
   - On "Scopes" page, click **SAVE AND CONTINUE**
   - On "Test users" page, click **SAVE AND CONTINUE**
   - Review and go back to dashboard

5. Create OAuth Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Choose **Web application**
   - Name: "Travel Buddy Web Client"
   - Under "Authorized JavaScript origins", click **ADD URI**:
     ```
     http://localhost:3000
     ```
   - Under "Authorized redirect URIs", click **ADD URI**:
     ```
     http://localhost:3000/auth/callback
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Replace `your-project-id` with your actual Supabase project ID
   - Click **CREATE**
   - Copy the **Client ID** (you'll need this)

## Step 2: Configure Google OAuth in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click on **Google**
5. Enable the toggle
6. Paste your **Client ID** from Google Cloud Console
7. Click **SAVE**

## Step 3: Find Your Supabase Redirect URL

In Supabase Auth/Providers/Google, you'll see:
```
https://your-project-id.supabase.co/auth/v1/callback
```

Add this URL to your Google OAuth credentials:
1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click your OAuth client
4. Under "Authorized redirect URIs", add the Supabase URL if not already there
5. Click **SAVE**

## Step 4: Test Google OAuth

1. Make sure your `.env.local` is set up:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key
   ```

2. Run your dev server:
   ```bash
   npm run dev
   ```

3. Go to http://localhost:3000/login

4. Click the **Google** button

5. You should be redirected to Google login, then back to your app

## Step 5: Production Setup

When deploying to production (e.g., Vercel, Netlify):

1. Update Google OAuth credentials with production URLs:
   - Add your production domain to "Authorized JavaScript origins"
   - Add `https://yourdomain.com/auth/callback` to "Authorized redirect URIs"

2. In Supabase, configure production redirect URL:
   - Go to **Authentication** → **Providers** → **Google**
   - Update redirect URL if needed

## Troubleshooting

### "redirect_uri_mismatch" error
- The redirect URL must match exactly between Google Cloud Console and Supabase
- Check for typos and make sure you included the full URL

### Google button not working
- Check browser console (F12) for errors
- Make sure `.env.local` variables are set correctly
- Restart your dev server after adding env variables

### User not created after Google login
- Check Supabase Auth logs: go to **Authentication** → **Auth logs**
- Ensure email is verified if you have that requirement enabled

## How It Works

When a user clicks the Google button:

1. They're redirected to Google login
2. After auth, Google redirects to `/auth/callback` with a code
3. The callback handler exchanges the code for a session
4. User is logged in and redirected to home page `/`

The login and signup pages both use the same Google OAuth flow:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Additional OAuth Providers

To add more OAuth providers (GitHub, Discord, etc.):

1. Go to Supabase **Authentication** → **Providers**
2. Enable the provider
3. Add the provider credentials
4. Update your login/signup pages to include buttons for those providers

```typescript
// Example: GitHub
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```
