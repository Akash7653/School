# Sadhana Memorial School - Deployment Guide

## Heroku Deployment

### Prerequisites
```bash
# Install Heroku CLI
# Windows: https://devcenter.heroku.com/articles/heroku-command-line

# Login to Heroku
heroku login
```

### Step 1: Create Heroku Apps

```bash
# Navigate to project root
cd c:\Users\admin\Desktop\School

# Create backend app (replace with unique name)
heroku create sadhana-school-api

# Create frontend app
heroku create sadhana-school-web
```

### Step 2: Configure Backend Environment Variables

```bash
# Set environment variables on backend app
heroku config:set -a sadhana-school-api \
  MONGODB_URL=<your-mongodb-connection-string> \
  DATABASE_NAME=school_db \
  JWT_SECRET=<your-jwt-secret> \
  RAZORPAY_KEY_ID=<your-razorpay-key> \
  RAZORPAY_KEY_SECRET=<your-razorpay-secret> \
  FRONTEND_URL=https://sadhana-school-web.herokuapp.com \
  ALLOWED_ORIGINS=https://sadhana-school-web.herokuapp.com \
  ENVIRONMENT=production
```

### Step 3: Deploy Backend

```bash
# Add Heroku git remote
heroku git:remote -a sadhana-school-api

# Deploy backend
git push heroku main
```

### Step 4: Configure Frontend

Update `frontend/src/utils/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sadhana-school-api.herokuapp.com/api';
```

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://sadhana-school-api.herokuapp.com/api
```

### Step 5: Deploy Frontend

```bash
# Create Procfile in frontend (if needed)
# heroku create sadhana-school-web --buildpack mars/create-react-app

# Deploy
git push heroku main
```

### Monitoring

```bash
# View logs
heroku logs -a sadhana-school-api --tail
heroku logs -a sadhana-school-web --tail

# Check app status
heroku ps -a sadhana-school-api
heroku ps -a sadhana-school-web

# View config vars
heroku config -a sadhana-school-api
```

### Database Setup (First Time)

```bash
# Connect to MongoDB and run initial setup
heroku run -a sadhana-school-api python backend/init_db.py
```

### Troubleshooting

- **Build fails**: Check `git log` for commit history
- **502 Bad Gateway**: Check logs with `heroku logs --tail`
- **Database connection error**: Verify MongoDB connection string in config vars
- **CORS errors**: Update `ALLOWED_ORIGINS` in backend config vars

