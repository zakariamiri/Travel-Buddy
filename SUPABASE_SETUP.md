# Supabase Authentication Setup Guide

## 1. Get Your Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **API** in your project
4. Copy:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon/Public key** (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

## 2. Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Paste your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

## 3. Configure OAuth (Google Login)

To enable Google authentication:

1. Go to your Supabase project → **Authentication** → **Providers**
2. Enable **Google** provider
3. Follow the setup instructions (you'll need Google OAuth credentials from Google Cloud Console)
4. Add your redirect URL: `http://localhost:3000/auth/callback` (for development)

## 4. Features Implemented

✅ **Email/Password Authentication**
- Sign up with email and password
- Login with email and password
- Password validation

✅ **OAuth Integration**
- Google login/signup
- Automatic redirect after auth

✅ **Session Management**
- Automatic session refresh via middleware
- Cookie-based session storage
- Server and client Supabase clients

## 5. Usage

### Sign In/Sign Up
Users can authenticate at `/login` and `/signup` routes

### Get Current User (Server Component)
```typescript
import { getUser } from '@/lib/auth'

export default async function Page() {
  const user = await getUser()
  return <div>{user?.email}</div>
}
```

### Sign Out (Server Action)
```typescript
import { signOut } from '@/lib/auth'

export default function LogoutButton() {
  return (
    <button onClick={async () => {
      'use server'
      await signOut()
    }}>
      Logout
    </button>
  )
}
```

## 6. File Structure

```
app/
├── auth/
│   └── callback/
│       └── route.ts          # OAuth callback handler
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # Login page
│   └── signup/
│       └── page.tsx          # Signup page
├── middleware.ts             # Session refresh middleware

lib/
├── auth.ts                   # Auth helper functions
└── utils.ts

utils/
└── supabase/
    ├── client.ts             # Browser client
    ├── server.ts             # Server client
    └── middleware.ts         # Middleware utilities
```

## 7. Testing

1. Run your app: `npm run dev`
2. Go to `http://localhost:3000/signup` to create an account
3. Go to `http://localhost:3000/login` to login
4. Test Google OAuth button

## 8. Production Deployment

Before deploying to production:

1. Update redirect URL in Supabase OAuth settings to your production domain
2. Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in production environment variables
3. Consider implementing email verification and password reset flows

## 9. Troubleshooting

**"Invalid project URL or API key"**
- Check your credentials in `.env.local`
- Make sure environment variables are correctly set

**OAuth redirects not working**
- Verify callback URL in Supabase OAuth settings
- Check browser console for errors

**Sessions not persisting**
- Clear browser cookies and try again
- Make sure middleware is running (check Next.js terminal)
