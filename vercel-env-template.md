# Vercel Environment Variables Setup

Copy these environment variables to your Vercel dashboard under **Settings > Environment Variables**:

## Required Environment Variables

### Database (Neon PostgreSQL recommended)
```
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

### Authentication
```
SESSION_SECRET=your-super-secure-session-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
```

### AI Service (Grok 4 Fast)
```
GROK_4_FAST_FREE_API_KEY=your-grok-api-key-here
```

### Backblaze B2 Cloud Storage
```
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_ACCESS_KEY_ID=your-b2-access-key-id
B2_SECRET_ACCESS_KEY=your-b2-secret-access-key
B2_BUCKET_NAME=AETHERMIND
```

### Application Settings
```
NODE_ENV=production
PORT=3000
```

## Database Setup Recommendations

### Option 1: Neon (Recommended for Vercel)
1. Visit https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables

### Option 2: Supabase
1. Visit https://supabase.com
2. Create a new project
3. Get PostgreSQL connection string
4. Add to Vercel environment variables

### Option 3: Railway
1. Visit https://railway.app
2. Deploy PostgreSQL
3. Copy connection string
4. Add to Vercel environment variables
