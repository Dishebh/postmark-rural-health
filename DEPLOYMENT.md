# Deployment Guide

This guide will help you deploy the Rural Health Triage Dashboard using free services.

## 1. Database Setup (Supabase)

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Run the database migrations:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `src/migrations/001_create_responders_table.sql`
   - Run the migration
4. Note down your project URL and anon key from Project Settings > API

## 2. Backend Deployment (Render)

1. Create a free account on [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Name: `rural-health-triage-api` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Add these environment variables:
     ```
     SUPABASE_URL=your-supabase-project-url
     SUPABASE_ANON_KEY=your-supabase-anon-key
     PORT=10000
     ```
5. Click "Create Web Service"
6. Note down your service URL (e.g., `https://rural-health-triage-api.onrender.com`)

## 3. Frontend Deployment (Vercel)

1. Create a free account on [Vercel](https://vercel.com)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. In your project's frontend directory, create a `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-url.onrender.com/api/:path*"
       }
     ]
   }
   ```
4. Create a `.env.production` file in the frontend directory:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   REACT_APP_SUPABASE_URL=your-supabase-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Deploy using Vercel CLI:
   ```bash
   cd frontend
   vercel
   ```
   Or connect your GitHub repository to Vercel for automatic deployments

## 4. Update CORS Settings

1. In your Supabase dashboard, go to Project Settings > API
2. Add your frontend domain to the CORS allowed origins
3. In your backend code (src/server.js), update the CORS settings:
   ```javascript
   app.use(cors({
     origin: ['https://your-frontend-url.vercel.app'],
     credentials: true
   }));
   ```

## 5. Environment Variables

### Backend (.env)
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=10000
```

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Free Tier Limitations

### Supabase
- 500MB database
- 2GB bandwidth
- 50,000 monthly active users
- 7-day log retention

### Render
- 750 hours/month of free usage
- 512MB RAM
- Shared CPU
- Automatic sleep after 15 minutes of inactivity
- Free SSL certificate

### Vercel
- Unlimited personal projects
- 100GB bandwidth/month
- Automatic HTTPS
- Continuous deployment from Git
- Serverless functions

## Monitoring Your Deployment

1. **Backend (Render)**:
   - Monitor logs in the Render dashboard
   - Set up email notifications for deployment status
   - Use the free tier's basic metrics

2. **Frontend (Vercel)**:
   - View deployment status in Vercel dashboard
   - Monitor performance metrics
   - Check build logs

3. **Database (Supabase)**:
   - Monitor database usage in Supabase dashboard
   - Set up database backups
   - View query performance

## Troubleshooting

1. **Backend Issues**:
   - Check Render logs for errors
   - Verify environment variables
   - Ensure CORS settings are correct
   - Check if the service is awake (first request might be slow)

2. **Frontend Issues**:
   - Verify API URL in production environment
   - Check browser console for errors
   - Ensure all environment variables are set
   - Clear browser cache if needed

3. **Database Issues**:
   - Check Supabase dashboard for connection issues
   - Verify database credentials
   - Monitor database usage and limits
   - Check if you've hit any free tier limits

## Security Considerations

1. Never commit `.env` files to version control
2. Use environment variables for all sensitive data
3. Keep your Supabase anon key secure
4. Regularly update dependencies
5. Monitor for suspicious activity

## Scaling Considerations

If you need to scale beyond free tiers:

1. **Database**: Upgrade Supabase to paid plan
2. **Backend**: Upgrade Render to paid plan for more resources
3. **Frontend**: Vercel's free tier is usually sufficient for most use cases

## Support

- Supabase: [Discord](https://discord.supabase.com)
- Render: [Documentation](https://render.com/docs)
- Vercel: [Documentation](https://vercel.com/docs) 