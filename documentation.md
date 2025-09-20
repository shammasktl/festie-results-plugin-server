# Festie Results Extension - API Documentation

## Base URL
```
http://localhost:5000
```

## Overview
This API provides endpoints for managing events, participants (candidates), results, and user authentication for the Festie Results Extension.

---

## 🔐 Authentication Endpoints

### 1. User Signup
**POST** `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully ✅",
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "token": "firebase_id_token",
  "refreshToken": "firebase_refresh_token"
}
```

**Error Responses:**
- `400` - Invalid input (email/password required, password too short)
- `400` - Email already exists
- `500` - Internal server error

---

### 2. User Login
**POST** `/api/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful ✅",
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com"
  },
  "token": "firebase_id_token",
  "refreshToken": "firebase_refresh_token"
}
```

**Error Responses:**
- `400` - Email and password required
- `401` - Invalid credentials
- `500` - Internal server error

---

### 3. Get User Profile
**GET** `/api/auth/profile`

Get current user's profile information. **Requires Authentication**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "user"
  }
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Invalid or expired token
- `500` - Internal server error

---

### 4. Refresh Token
**POST** `/api/auth/refresh`

Refresh an expired ID token.

**Request Body:**
```json
{
  "refreshToken": "firebase_refresh_token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "new_firebase_id_token",
  "refreshToken": "new_firebase_refresh_token"
}
```

**Error Responses:**
- `400` - Refresh token required
- `401` - Invalid refresh token
- `500` - Internal server error

---

## 📅 Events Management

### 5. Get All Events
**GET** `/api/events`

Retrieve all available events. **Public Access**

**Response (200 OK):**
```json
[
  {
    "id": "event_id_1",
    "name": "Annual Talent Show",
    "participants": [],
    "results": [],
    "extraAwards": [],
    "status": "not_published"
  },
  {
    "id": "event_id_2",
    "name": "Dance Competition",
    "participants": [],
    "results": [],
    "extraAwards": [],
    "status": "published"
  }
]
```

**Error Responses:**
- `500` - Internal server error

---

### 6. Create New Event
**POST** `/api/events`

Create a new event. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**Request Body:**
```json
{
  "id": "unique_event_id",
  "name": "Summer Music Festival"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Event created ✅"
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Invalid or expired token
- `500` - Internal server error

---

## 👥 Participants (Candidates) Management

### 7. Get Event Participants
**GET** `/api/event/:id/candidates`

Get all participants for a specific event. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/talent_show_2024/candidates`

**Response (200 OK):**
```json
{
  "eventId": "talent_show_2024",
  "participants": [
    {
      "id": "participant_1",
      "name": "Alice Johnson",
      "category": "singing",
      "details": "Classical singer"
    },
    {
      "id": "participant_2",
      "name": "Bob Smith",
      "category": "dancing",
      "details": "Hip-hop dancer"
    }
  ]
}
```

**Error Responses:**
- `404` - Event not found
- `500` - Internal server error

---

### 8. Add Participants to Event
**POST** `/api/event/:id/candidates`

Add participants to a specific event. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `id` - Event ID

**Request Body:**
```json
{
  "participants": [
    {
      "id": "participant_3",
      "name": "Charlie Brown",
      "category": "singing",
      "details": "Pop singer"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Participants added ✅"
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Invalid or expired token
- `404` - Event not found
- `500` - Internal server error

---

## 🏆 Results Management

### 9. Get Event Results
**GET** `/api/event/:id/results`

Get results for a specific event. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/talent_show_2024/results`

**Response (200 OK):**
```json
{
  "eventId": "talent_show_2024",
  "results": [
    {
      "position": 1,
      "participantId": "participant_1",
      "participantName": "Alice Johnson",
      "category": "singing",
      "score": 95
    },
    {
      "position": 2,
      "participantId": "participant_2",
      "participantName": "Bob Smith",
      "category": "dancing",
      "score": 88
    }
  ],
  "extraAwards": [
    {
      "award": "Best Performance",
      "participantId": "participant_1",
      "participantName": "Alice Johnson"
    }
  ]
}
```

**Error Responses:**
- `404` - Event not found
- `500` - Internal server error

---

### 10. Save Event Results
**POST** `/api/event/:id/results`

Save results for a specific event. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `id` - Event ID

**Request Body:**
```json
{
  "results": [
    {
      "position": 1,
      "participantId": "participant_1",
      "participantName": "Alice Johnson",
      "category": "singing",
      "score": 95
    },
    {
      "position": 2,
      "participantId": "participant_2",
      "participantName": "Bob Smith",
      "category": "dancing",
      "score": 88
    }
  ],
  "extraAwards": [
    {
      "award": "Best Performance",
      "participantId": "participant_1",
      "participantName": "Alice Johnson"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results saved to Firestore ✅"
}
```

**Error Responses:**
- `401` - No token provided
- `403` - Invalid or expired token
- `404` - Event not found
- `500` - Internal server error

---

## 🔑 Authentication

### Protected Routes
The following endpoints require authentication:
- `POST /api/events` (Create Event)
- `POST /api/event/:id/candidates` (Add Participants)
- `POST /api/event/:id/results` (Save Results)
- `GET /api/auth/profile` (Get Profile)

### How to Use Authentication
1. **Sign up** or **login** to get an ID token
2. Include the token in the `Authorization` header:
   ```
   Authorization: Bearer YOUR_ID_TOKEN
   ```
3. The token expires periodically - use the refresh token endpoint to get a new one

---

## 📝 Example Usage

### Complete Workflow Example

1. **Create a user account:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@festival.com",
    "password": "admin123",
    "displayName": "Festival Admin"
  }'
```

2. **Login to get token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@festival.com",
    "password": "admin123"
  }'
```

3. **Create an event (using token from login):**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "id": "summer_fest_2024",
    "name": "Summer Music Festival 2024"
  }'
```

4. **Get all events:**
```bash
curl http://localhost:5000/api/events
```

5. **Add participants:**
```bash
curl -X POST http://localhost:5000/api/event/summer_fest_2024/candidates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "participants": [
      {
        "id": "singer_001",
        "name": "Taylor Swift",
        "category": "singing",
        "details": "Pop artist"
      }
    ]
  }'
```

6. **Save results:**
```bash
curl -X POST http://localhost:5000/api/event/summer_fest_2024/results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "results": [
      {
        "position": 1,
        "participantId": "singer_001",
        "participantName": "Taylor Swift",
        "category": "singing",
        "score": 98
      }
    ],
    "extraAwards": []
  }'
```

7. **View results:**
```bash
curl http://localhost:5000/api/event/summer_fest_2024/results
```

---

## 📊 Response Codes

- `200` - OK (Successful GET, PUT, PATCH, DELETE)
- `201` - Created (Successful POST)
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (No token provided)
- `403` - Forbidden (Invalid/expired token)
- `404` - Not Found (Resource doesn't exist)
- `500` - Internal Server Error

---

## 🛠️ Environment Setup

### Required Environment Variables (.env)
```env
PORT=5000
FIREBASE_API_KEY=your_firebase_web_api_key
TEST_USER_EMAIL=admin@example.com
TEST_USER_PASSWORD=admin123
GOOGLE_APPLICATION_CREDENTIALS=config/firebaseServiceAccount.json
```

### Prerequisites
- Node.js and npm installed
- Firebase project with Firestore and Authentication enabled
- Firebase service account key file (`firebaseServiceAccount.json`)
- Firebase Web API Key (from Firebase Console → Project Settings → General → Web Apps)

### Firebase Setup Steps
1. **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/)
2. **Enable Firestore**: Go to Firestore Database → Create database → Start in test mode
3. **Enable Authentication**: Go to Authentication → Get started → Sign-in method → Enable Email/Password
4. **Get Web API Key**: Project Settings → General → Your apps → Web app → Copy `apiKey`
5. **Download Service Account**: Project Settings → Service accounts → Generate new private key
6. **Place Service Account**: Save as `config/firebaseServiceAccount.json`

---

## 🐛 Troubleshooting

### Common Errors and Solutions

#### 1. "CONFIGURATION_NOT_FOUND"
**Problem**: Firebase Authentication not enabled
**Solution**: 
- Enable Authentication in Firebase Console
- Enable Email/Password sign-in method

#### 2. "API key not valid"
**Problem**: Incorrect Firebase Web API Key
**Solution**:
- Get correct Web API Key from Firebase Console → Project Settings → Web Apps
- Update `FIREBASE_API_KEY` in `.env` file

#### 3. "7 PERMISSION_DENIED: Cloud Firestore API has not been used"
**Problem**: Firestore not enabled
**Solution**:
- Enable Firestore Database in Firebase Console
- Create database in test mode for development

#### 4. "Error: Could not load the default credentials"
**Problem**: Firebase service account file missing or incorrect path
**Solution**:
- Download service account JSON from Firebase Console
- Place in `config/firebaseServiceAccount.json`
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

#### 5. Server not starting
**Problem**: Missing dependencies or environment variables
**Solution**:
```bash
npm install
cp .env.example .env  # If you have an example file
npm run dev
```

### Test Firebase Configuration
Run this command to test your Firebase setup:
```bash
node scripts/testFirebaseConfig.js
```

### Reset Firebase User (if test user creation failed)
1. Go to Firebase Console → Authentication → Users
2. Delete test users if needed
3. Re-run signup endpoint

---

## 📋 Notes

- All requests and responses use JSON format
- Timestamps are in ISO 8601 format
- Event IDs should be unique strings
- Participant IDs should be unique within each event
- The API uses Firebase Authentication for user management
- Firestore is used for data storage

---

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Configure Firebase (see Firebase Setup Steps above)
5. Start the server: `npm run dev`
6. Test endpoints using the examples above

The API will be available at `http://localhost:5000`

---

## 📋 Quick Reference - All Endpoints

### Authentication
- `POST /api/auth/signup` - Create user account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (🔒 Protected)
- `POST /api/auth/refresh` - Refresh token

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event (🔒 Protected)

### Participants/Candidates
- `GET /api/event/:id/candidates` - Get event participants
- `POST /api/event/:id/candidates` - Add participants (🔒 Protected)

### Results
- `GET /api/event/:id/results` - Get event results
- `POST /api/event/:id/results` - Save event results (🔒 Protected)

### Testing Scripts
- `node scripts/testFirebaseConfig.js` - Test Firebase configuration
- `node scripts/getToken.js` - Get authentication token for testing

**🔒 Protected** = Requires `Authorization: Bearer TOKEN` header
