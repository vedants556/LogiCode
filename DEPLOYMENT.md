# LogiCode Deployment Guide

This guide will help you deploy your LogiCode full-stack application to various hosting platforms.

## Prerequisites

1. **API Keys Required:**

   - Gemini API Key (for AI features)
   - MySQL Database (for data storage)

2. **Environment Variables:**
   ```bash
   SQL_PASSWORD=your_mysql_password
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret_key
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_NAME=your_database_name
   DB_PORT=3306
   ```

## Option 1: Railway (Recommended - Easiest)

### Steps:

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Add MySQL Database:**

   - Go to your project dashboard
   - Click "New" → "Database" → "MySQL"
   - Railway will provide connection details

4. **Set Environment Variables:**

   - Go to your service settings
   - Add all environment variables from the list above
   - Use Railway's MySQL connection details for DB\_\* variables

5. **Deploy:**
   - Railway will automatically build and deploy your app
   - Your app will be available at `https://your-app-name.railway.app`

### Railway Configuration:

- Uses the `railway.json` file for build configuration
- Automatically detects Node.js and installs dependencies
- Handles both frontend build and backend deployment

## Option 2: Render

### Steps:

1. **Sign up at [Render.com](https://render.com)**
2. **Create a new Web Service:**

   - Connect your GitHub repository
   - Choose "Web Service"
   - Select your repository

3. **Configure Build Settings:**

   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

4. **Add Database:**

   - Create a new PostgreSQL database (or use external MySQL)
   - Note: You may need to modify database connection for PostgreSQL

5. **Set Environment Variables:**
   - Add all required environment variables
   - Use your database connection details

## Option 3: Vercel + PlanetScale

### Frontend (Vercel):

1. **Sign up at [Vercel.com](https://vercel.com)**
2. **Import your repository**
3. **Configure build settings:**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

### Backend (Railway/Render):

- Deploy backend separately using Railway or Render
- Update frontend API URLs to point to your backend

### Database (PlanetScale):

1. **Sign up at [PlanetScale.com](https://planetscale.com)**
2. **Create a new database**
3. **Get connection string and update environment variables**

## Option 4: DigitalOcean App Platform

### Steps:

1. **Sign up at [DigitalOcean](https://digitalocean.com)**
2. **Create a new App:**

   - Connect GitHub repository
   - Choose "Web Service"

3. **Configure App Spec:**

   ```yaml
   name: logicode
   services:
     - name: web
       source_dir: /
       github:
         repo: your-username/your-repo
         branch: main
       run_command: npm start
       build_command: npm run build
       environment_slug: node-js
       instance_count: 1
       instance_size_slug: basic-xxs
       envs:
         - key: NODE_ENV
           value: production
         - key: SQL_PASSWORD
           value: your_password
         - key: GEMINI_API_KEY
           value: your_api_key
   ```

4. **Add Database:**
   - Create a MySQL database
   - Update environment variables with connection details

## Database Setup

### For MySQL:

1. **Create database:**

   ```sql
   CREATE DATABASE codesync;
   ```

2. **Import your database schema** (if you have one)
3. **Update connection details in environment variables**

### For PostgreSQL (Render):

You may need to modify the database connection in `backend/index.js`:

```javascript
const db = mysql2.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432, // PostgreSQL default port
});
```

## Post-Deployment Steps

1. **Test your application:**

   - Visit your deployed URL
   - Test all features (login, code execution, etc.)

2. **Configure custom domain (optional):**

   - Add your domain in hosting platform settings
   - Update DNS records

3. **Set up monitoring:**
   - Enable logging
   - Set up error tracking (Sentry, etc.)

## Troubleshooting

### Common Issues:

1. **Build failures:** Check that all dependencies are in package.json
2. **Database connection:** Verify environment variables are set correctly
3. **CORS issues:** Backend includes CORS configuration
4. **Static files:** Backend serves frontend build files

### Environment Variables Checklist:

- [ ] SQL_PASSWORD
- [ ] GEMINI_API_KEY
- [ ] JWT_SECRET
- [ ] DB_HOST
- [ ] DB_USER
- [ ] DB_NAME
- [ ] DB_PORT
- [ ] NODE_ENV=production

## Cost Estimates

- **Railway:** Free tier → $5/month
- **Render:** Free tier available
- **Vercel:** Free tier → $20/month
- **DigitalOcean:** $5/month minimum

Choose the option that best fits your needs and budget!
