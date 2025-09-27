# 🚀 AetherMind Vercel Deployment Guide

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Repository** - Your AetherMind code pushed to GitHub
3. **Database** - PostgreSQL database (Neon recommended)
4. **API Keys** - Grok 4 Fast API key, Backblaze B2 credentials

## Step-by-Step Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 2. Set Up Database

#### Option A: Neon (Recommended)
1. Go to https://neon.tech
2. Create new project: "aethermind-production"
3. Copy connection string
4. Save for environment variables

#### Option B: Supabase
1. Go to https://supabase.com
2. Create new project
3. Get PostgreSQL connection string from Settings > Database
4. Save for environment variables

### 3. Deploy to Vercel

#### Method 1: GitHub Integration (Recommended)
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your AetherMind repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/dist`

#### Method 2: Vercel CLI
```bash
# In your project directory
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: aethermind
# - Directory: ./
# - Want to override settings? Yes
# - Build Command: npm run vercel-build
# - Output Directory: client/dist
# - Development Command: npm run dev
```

### 4. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```env
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_jwt_secret
GROK_4_FAST_FREE_API_KEY=your_grok_api_key
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_ACCESS_KEY_ID=your_b2_access_key
B2_SECRET_ACCESS_KEY=your_b2_secret_key
B2_BUCKET_NAME=AETHERMIND
NODE_ENV=production
```

### 5. Database Migration

After deployment, run database migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:push

# Or use your database provider's console to run:
# - migrations/0000_wakeful_red_ghost.sql
# - migrations/add_cloud_key_column.sql
```

### 6. Verify Deployment

1. **Check build logs** in Vercel dashboard
2. **Test core features**:
   - User registration/login
   - Project creation
   - File upload
   - AI tools (citations, analysis)
   - Team collaboration

### 7. Custom Domain (Optional)

1. In Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for SSL certificate provisioning

## Troubleshooting

### Build Issues
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Verify TypeScript compilation with `npm run check`

### Database Connection
- Ensure DATABASE_URL includes `?sslmode=require`
- Check connection string format
- Verify database is accessible from Vercel

### Environment Variables
- Double-check all required variables are set
- Ensure no trailing spaces or quotes
- Redeploy after adding variables

### File Upload Issues
- Verify Backblaze B2 credentials
- Check bucket permissions
- Test B2 connection with test script

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrated successfully
- [ ] File uploads working (B2 integration)
- [ ] AI features functional (citations, analysis)
- [ ] User authentication working
- [ ] Team collaboration features active
- [ ] Real-time notifications working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Performance monitoring set up

## Post-Deployment

1. **Monitor Performance** - Use Vercel Analytics
2. **Set up Alerts** - Configure error notifications
3. **User Testing** - Invite beta users to test
4. **Feedback Collection** - Set up user feedback system
5. **Plan Phase 2** - Advanced features roadmap

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **AetherMind Issues**: Create GitHub issues for bugs

---

**🎉 Your AetherMind platform is now live on Vercel!**
