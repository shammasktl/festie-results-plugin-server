# 🚀 Render Deployment Guide for Festie Results Backend

## Quick Deployment Steps

### 1. Prepare Firebase Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" to download the JSON file
3. Copy the entire JSON content (you'll need it for environment variables)

### 2. Deploy to Render

1. **Connect Repository**
   - Go to [Render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository containing this backend code

2. **Configure Service**
   - **Name**: `festie-results-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

3. **Set Environment Variables**
   ```bash
   # Required Environment Variables
   NODE_ENV=production
   FIREBASE_API_KEY=your_firebase_web_api_key
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
   CORS_ORIGIN=https://your-frontend-domain.onrender.com
   COOKIE_SAMESITE=None
   COOKIE_SECURE=true
   
   # Optional
   TEST_USER_EMAIL=admin@example.com
   TEST_USER_PASSWORD=admin123
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Your backend will be available at: `https://your-service-name.onrender.com`

### 3. Update Frontend CORS

Update your frontend to use the new backend URL:
```javascript
const API_BASE_URL = 'https://your-service-name.onrender.com';
```

## Environment Variables Explained

### Required Variables

- **`NODE_ENV`**: Set to `production` for production deployment
- **`FIREBASE_API_KEY`**: Your Firebase Web API Key from Firebase Console
- **`GOOGLE_APPLICATION_CREDENTIALS_JSON`**: Complete Firebase service account JSON (as string)
- **`CORS_ORIGIN`**: Your frontend domain URL

### Security Variables

- **`COOKIE_SAMESITE`**: Set to `None` for cross-site requests in production
- **`COOKIE_SECURE`**: Set to `true` to require HTTPS for cookies

### Optional Variables

- **`TEST_USER_EMAIL`** / **`TEST_USER_PASSWORD`**: For testing authentication

## How to Get Firebase Credentials JSON

1. Go to Firebase Console
2. Select your project
3. Go to Project Settings (gear icon)
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Copy the entire JSON content
7. Paste it as the value for `GOOGLE_APPLICATION_CREDENTIALS_JSON`

Example format:
```json
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

## Verification Steps

1. **Check Deployment Status**
   - Go to your Render dashboard
   - Check if the service is "Live"
   - Look for any build/deployment errors

2. **Test Health Endpoint**
   ```bash
   curl https://your-service-name.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "message": "Festie Results Backend is running",
     "timestamp": "...",
     "environment": "production"
   }
   ```

3. **Test API Endpoints**
   ```bash
   # Test root endpoint
   curl https://your-service-name.onrender.com/
   
   # Test events endpoint
   curl https://your-service-name.onrender.com/api/events
   ```

## Troubleshooting

### Common Issues

1. **Firebase Connection Failed**
   - Check `GOOGLE_APPLICATION_CREDENTIALS_JSON` is properly formatted
   - Verify Firebase project has Firestore enabled
   - Check service account permissions

2. **CORS Errors**
   - Verify `CORS_ORIGIN` matches your frontend domain exactly
   - Make sure frontend is making requests with credentials included

3. **Build Failures**
   - Check Node.js version compatibility (requires Node 18+)
   - Verify all dependencies are listed in package.json

4. **Cookie Issues**
   - Set `COOKIE_SAMESITE=None` and `COOKIE_SECURE=true` for production
   - Ensure frontend domain uses HTTPS

### Logs and Debugging

1. **View Render Logs**
   - Go to Render dashboard → Your service → Logs
   - Check for startup errors or runtime issues

2. **Enable Debug Mode**
   - Temporarily set `NODE_ENV=development` to see detailed error messages
   - Remember to change back to `production` after debugging

## Production Optimizations

### Performance
- Service automatically scales based on traffic
- Use paid plan for better performance and no sleep mode
- Consider adding Redis for session storage if needed

### Security
- All environment variables are encrypted
- Service runs on HTTPS automatically
- Firewall and DDoS protection included

### Monitoring
- Built-in health checks at `/health`
- Automatic restarts on crashes
- Email notifications for downtime

## Updating the Deployment

1. **Automatic Deployment**
   - Push changes to your connected Git repository
   - Render automatically rebuilds and redeploys

2. **Manual Deployment**
   - Go to Render dashboard → Your service
   - Click "Manual Deploy" → "Deploy latest commit"

## Cost Information

- **Free Plan**: Limited to 750 hours/month, sleeps after 15 minutes of inactivity
- **Paid Plans**: Start at $7/month, no sleep mode, better performance
- **Database**: Firebase Firestore has free tier, then pay-per-usage

## Support

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Firebase documentation: https://firebase.google.com/docs
3. Review the logs in Render dashboard
4. Check this project's README.md for API documentation

---

🎉 **Your Festie Results Backend is now production-ready on Render!**