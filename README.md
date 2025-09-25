# 🏆 Festie Results Backend API

A comprehensive backend API for managing festival/competition results with a sophisticated 1-11 scoring system, team management, and strategic result analysis.

## 🚀 **DEPLOYED ON RENDER**

**Production API URL**: `https://your-service-name.onrender.com`
**Health Check**: `https://your-service-name.onrender.com/health`

## ✨ Key Features

- **🎯 New 1-11 Scoring System**: Granular position/grade control (11=1st A, 10=2nd A, 9=3rd A, 8=A only, 7=1st B, 6=2nd B, 5=3rd B, 4=B only, 3=1st only, 2=2nd only, 1=3rd only)
- **🏗️ Auto-Generated Event IDs**: Unique event identification with timestamp and random suffixes
- **👥 Team-Based Management**: Complete team and candidate management system
- **📊 Strategic Results**: AI-powered program selection for team ranking manipulation
- **🔐 Session-Based Authentication**: HTTP-only cookies with automatic token refresh
- **📱 Mobile-Ready**: Full CORS support for cross-platform applications
- **🔄 Real-Time Updates**: Live result publishing and team score calculations

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/` | API information and status |
| `POST` | `/api/events` | Create event (auto-generates ID) |
| `GET` | `/api/events` | List all events |
| `PATCH` | `/api/event/:eventId/programs/:programId/scores` | Update results (1-11 scoring) |
| `GET` | `/api/event/:id/strategic-results` | Get strategic program recommendations |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create user account |
| `POST` | `/api/auth/login` | User login with cookies |
| `GET` | `/api/auth/profile` | Get user profile |
| `POST` | `/api/auth/refresh` | Refresh authentication token |
| `POST` | `/api/auth/logout` | Logout and clear cookies |

For complete API documentation, see:
- [NEW_SCORING_SYSTEM_API_DOCS.md](./NEW_SCORING_SYSTEM_API_DOCS.md) - Complete 1-11 scoring system documentation
- [documentation.md](./documentation.md) - Legacy documentation with updates

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js with production middleware
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth with custom session management
- **Deployment**: Render.com with auto-scaling and direct Git integration
- **Security**: CORS, Cookie security, Input validation

## 🔧 Local Development

### Prerequisites

- Node.js 18+ 
- Firebase project with Firestore and Authentication enabled
- Firebase service account key

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

3. **Firebase Setup**
   - Place `firebaseServiceAccount.json` in `config/` directory
   - Update `.env` with your Firebase Web API Key

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Server runs at: `http://localhost:5000`

## 🚀 Production Deployment

### Deploy to Render

1. **Quick Deploy**: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

2. **Manual Setup**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete guide

### Environment Variables (Production)

```bash
NODE_ENV=production
PORT=5000
FIREBASE_API_KEY=your_firebase_web_api_key
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
CORS_ORIGIN=https://your-frontend-domain.com
COOKIE_SAMESITE=None
COOKIE_SECURE=true
```

## 📖 Scoring System Guide

### New 1-11 Scoring System

| Score | Position | Grade | Use Case |
|-------|----------|-------|----------|
| 11 | 1st Place | A | Top performer with highest grade |
| 10 | 2nd Place | A | Excellent performance, high grade |
| 9 | 3rd Place | A | Good performance, high grade |
| 8 | None | A | High grade recognition only |
| 7 | 1st Place | B | Top performer with good grade |
| 6 | 2nd Place | B | Good performance, good grade |
| 5 | 3rd Place | B | Decent performance, good grade |
| 4 | None | B | Good grade recognition only |
| 3 | 1st Place | None | Top placement without grade |
| 2 | 2nd Place | None | Second placement without grade |
| 1 | 3rd Place | None | Third placement without grade |

### Example Usage

```javascript
// Update program results with new scoring
const scores = {
  "Alice Johnson": 11,    // 1st Place with A grade
  "Bob Smith": 10,        // 2nd Place with A grade  
  "Charlie Brown": 8,     // A grade only
  "Diana Prince": 7,      // 1st Place with B grade
  "Eve Wilson": 4,        // B grade only
  "Frank Miller": 3       // 1st Place only
};
```

## 🔍 API Examples

### Create Event (Auto-Generated ID)
```bash
curl -X POST https://your-service-name.onrender.com/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Summer Festival 2024"}'
```

### Update Program Results
```bash
curl -X PATCH https://your-service-name.onrender.com/api/event/{eventId}/programs/{programId}/scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"scores": {"Alice": 11, "Bob": 10, "Charlie": 9}}'
```

### Get Strategic Results
```bash
curl "https://your-service-name.onrender.com/api/event/{eventId}/strategic-results?raiseTeam=Team%20Alpha&limit=5"
```

## 🛡️ Security Features

- **Input Validation**: Comprehensive request validation and sanitization
- **CORS Protection**: Configurable origin allowlist
- **Cookie Security**: HTTP-only, secure, SameSite cookies
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Secure error responses without information leakage
- **Firebase Security**: Server-side authentication verification

## 📈 Performance & Monitoring

- **Health Checks**: Built-in `/health` endpoint for monitoring
- **Auto-Scaling**: Render automatically scales based on traffic
- **Database Optimization**: Efficient Firestore queries with indexing
- **Caching**: Strategic result caching for improved performance
- **Logging**: Comprehensive request/error logging for debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- **Documentation**: See [NEW_SCORING_SYSTEM_API_DOCS.md](./NEW_SCORING_SYSTEM_API_DOCS.md) for complete API reference
- **Issues**: Report bugs or request features via GitHub Issues
- **Deployment Help**: Check [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for deployment troubleshooting

---

**🎉 Ready for production deployment on Render! 🚀**

### Project Vision

By shifting from plain, static result publishing to an interactive, curiosity-driven preview stage, this extension aligns with the true spirit of an arts fest: excitement, participation, and celebration. With its focus on both candidate experience and organizer efficiency, this extension is innovative, impactful, and hackathon-ready.
