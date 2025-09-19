# Deployment Guide

This guide explains how to deploy the HyperWallet Collector application to Vercel with PostgreSQL database support.

## Prerequisites

1. A Vercel account
2. A PostgreSQL database (can be hosted on services like:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Supabase](https://supabase.com/)
   - [Railway](https://railway.app/)
   - [Heroku Postgres](https://www.heroku.com/postgres)
   - Self-hosted PostgreSQL)

## Deployment Steps

### 1. Prepare Your Database

First, you'll need to set up a PostgreSQL database. If you're using Vercel, you can use their integrated Postgres service:

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database" and select "Postgres"
4. Follow the setup instructions

Alternatively, you can use any external PostgreSQL provider.

### 2. Set Environment Variables

In your Vercel project settings, add the following environment variables:

```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

The `DATABASE_URL` should be provided by your PostgreSQL provider.

### 3. Deploy to Vercel

You can deploy the application in several ways:

#### Option 1: Deploy from GitHub
1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### Option 2: Deploy using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 4. Initialize Database Tables

After deployment, you'll need to initialize the database tables. There are two ways to do this:

#### Option 1: Run the initialization script manually
If you have access to run scripts on your deployment, you can run:
```bash
npm run db:init
```

#### Option 2: Use the automatic initialization
The application is configured to automatically initialize the database on startup, so this should happen automatically when the application starts.

### 5. Migrate Existing Data (if applicable)

If you have existing data in JSON format that you want to migrate to the database:

1. Ensure your local environment is configured with the same `DATABASE_URL` as your production environment
2. Run the migration script:
   ```bash
   npm run db:migrate
   ```

## Vercel Configuration

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables
Make sure to set these environment variables in your Vercel project settings:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV` - Set to `production`

## Troubleshooting

### Database Connection Issues
If you encounter database connection issues:
1. Verify your `DATABASE_URL` is correct
2. Ensure your database allows connections from Vercel's IP addresses
3. Check if you need to enable SSL connections

### Missing Tables
If you get errors about missing tables:
1. Make sure the database initialization ran successfully
2. You can manually run `npm run db:init` if needed

### Performance Issues
For better performance with large datasets:
1. Ensure proper indexing on the wallets table (already included in the schema)
2. Consider adding additional indexes if needed for your specific queries

## Monitoring

After deployment, you can monitor your application through:
1. Vercel's built-in analytics
2. Database performance monitoring through your PostgreSQL provider
3. Application logs in Vercel's dashboard

## Scaling

For high-traffic applications:
1. Consider using connection pooling (already implemented)
2. Monitor database performance and optimize queries as needed
3. Use database read replicas if necessary
4. Implement caching for frequently accessed data