# Festie Results Extension - API Documentation

## Base URL
```
http://localhost:5000
```

## Overview
This API provides endpoints for managing events, participants (candidates), results, and user authentication for the Festie Results Extension.

**🆕 Key Features:**
- **Auto-Generated Event IDs**: Event IDs are automatically generated from event names with timestamp and random suffixes for uniqueness
- **Team-Based Management**: All programs require team assignments for participants
- **NEW 1-11 Scoring System**: Enhanced scoring with position/grade flexibility (11=1st A, 10=2nd A, 9=3rd A, 8=A only, 7=1st B, 6=2nd B, 5=3rd B, 4=B only, 3=1st only, 2=2nd only, 1=3rd only)
- **Session-Based Authentication**: HTTP-only cookies with automatic token refresh
- **Strategic Results**: Team ranking manipulation through program selection

---

## 🧭 API Route Summary

| Method | Path | Auth | Purpose |
|-------:|------|------|---------|
| POST | /api/auth/signup | Public | Create a user account |
| POST | /api/auth/login | Public | Login and set cookies |
| POST | /api/auth/refresh | Public | Refresh ID token (via cookie or body) |
| GET | /api/auth/profile | Protected | Current user + events created by user |
| POST | /api/auth/logout | Protected | Clear auth cookies |
| GET | /api/events | Public/Optional | List events (filtered to your events if authenticated) |
| POST | /api/events | Protected | Create a new event (auto-generates unique ID) |
| GET | /api/event/:id | Public | Get event by ID |
| GET | /api/event/:id/candidates | Public | List event candidates |
| POST | /api/event/:id/candidates | Protected | Add candidates to event |
| GET | /api/event/:id/teams | Public | List event teams |
| POST | /api/event/:id/teams | Protected | Add teams to event |
| GET | /api/event/:id/programs | Public | List programs of event |
| POST | /api/event/:id/programs | Protected | Create a program (requires team per candidate) |
| PATCH | /api/event/:eventId/programs/:programId/scores | Protected | Update program results (NEW 1-11 scoring system) |
| GET | /api/event/:id/results | Public | Get event results |
| POST | /api/event/:id/results | Protected | Save event results (NEW 1-11 scoring system) |
| POST | /api/event/:id/publish-results | Protected | Publish event results |

Legend: Protected accepts Authorization header or authenticated cookies. Optional auth filters some responses by current user.

---

## 🔐 Authentication & Sessions

This API supports session-like auth via secure HTTP-only cookies in addition to Authorization headers.

- After successful signup/login/refresh, the server sets two cookies:
  - `token` (Firebase ID token) — httpOnly, cookie lifetime ~24h (token itself typically valid ~1h; app should refresh when needed)
  - `refreshToken` — httpOnly, expires ~7d
- You can keep using the Authorization header (Bearer <token>), but cookies are recommended for browser apps.
- CORS is configured to allow credentials; when calling from the browser, ensure you pass `credentials: 'include'`.
- **Auto-Refresh**: The authentication middleware automatically detects expired tokens and refreshes them using the `refreshToken` cookie, ensuring seamless user experience without manual token management.

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

Cookies: Sets `token` and `refreshToken` as httpOnly cookies.

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

Cookies: Sets `token` and `refreshToken` as httpOnly cookies.

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

Auth: Provide either
- Authorization header: `Bearer YOUR_ID_TOKEN`, or
- Cookies set by signup/login/refresh (preferred for browsers)

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "user",
    "events": [
      {
        "id": "summer_music_festival_123456_ab3d",
        "name": "Summer Music Festival",
        "status": "not_published",
        "createdBy": "firebase_user_id",
        "createdAt": "2025-09-22T10:00:00.000Z"
      }
    ]
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

Auth: You can provide the refresh token via either the cookie or the body.

**Request Body (optional if cookie present):**
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

### 5. Logout
**POST** `/api/auth/logout`

Clears the authentication cookies.

**Response (200 OK):**
```json
{ "success": true, "message": "Logged out" }
```

---

## 📅 Events Management

### 5. Get All Events
**GET** `/api/events`

Retrieve all available events. **Public Access**

Note: If you include an auth token, the response will be filtered to events created by the authenticated user.

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

Create a new event with automatically generated unique ID. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**Request Body:**
```json
{
  "name": "Summer Music Festival"
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Event name (must not be empty) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Event created ✅",
  "eventId": "summer_music_festival_123456_ab3d",
  "event": {
    "id": "summer_music_festival_123456_ab3d",
    "name": "Summer Music Festival",
    "participants": [],
    "results": [],
    "extraAwards": [],
    "status": "not_published",
    "createdBy": "firebase_user_id",
    "createdAt": "2025-09-25T10:00:00.000Z"
  }
}
```

**Auto-Generated Event ID Format:**
- Based on event name: special characters removed, spaces converted to underscores
- Includes timestamp suffix for uniqueness
- Includes random suffix for additional uniqueness  
- Example: `"Summer Music Festival!"` → `"summer_music_festival_123456_ab3d"`

**Error Responses:**
- `400` - Event name is required
- `401` - No token provided
- `403` - Invalid or expired token
- `500` - Internal server error

---

## 👥 Participants (Candidates) Management

### 7. Get Event Candidates
**GET** `/api/event/:id/candidates`

Get all candidates for a specific event. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/talent_show_2024/candidates`

**Response (200 OK):**
```json
{
  "eventId": "talent_show_2024",
  "candidates": [
    {
      "id": "auto-generated-id-1",
      "name": "Alice Johnson",
      "team": "Team Alpha",
      "id": "alice_001"
    },
    {
      "id": "auto-generated-id-2", 
      "name": "Bob Smith",
      "team": "Team Beta",
      "id": "bob_002"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | ID of the event |
| `candidates` | array | List of all candidates in the event |
| `candidates[].id` | string | Unique candidate identifier |
| `candidates[].name` | string | Candidate's full name |
| `candidates[].team` | string | Team the candidate belongs to |

**Error Responses:**
- `404` - Event not found
- `500` - Internal server error

---

### 8. Add Candidates to Event
**POST** `/api/event/:id/candidates`

Add candidates to a specific event. **Requires Authentication (Admin)**

**⚠️ Important:** Each candidate must be assigned to an existing team. Teams must be created first using `POST /api/event/:id/teams`.

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `id` - Event ID

**Request Body:**
```json
{
  "candidates": [
    {
      "name": "Charlie Brown",
      "team": "Team Alpha",
      "id": "charlie_003"
    },
    {
      "name": "Diana Prince", 
      "team": "Team Beta",
      "id": "diana_004"
    }
  ]
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `candidates` | array | Yes | Array of candidate objects |
| `candidates[].name` | string | Yes | Candidate's full name (must be unique) |
| `candidates[].team` | string | Yes | Team name (must exist in teams collection) |
| `candidates[].id` | string | No | Optional custom ID for the candidate |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Candidates added ✅"
}
```

**Error Responses:**
- `400` - Missing required fields (name or team)
- `400` - Invalid team names (teams don't exist)
- `400` - Duplicate candidate names
- `401` - No token provided
- `403` - Invalid or expired token
- `404` - Event not found
- `500` - Internal server error

### ⚠️ Required Workflow for Adding Candidates

**Step 1:** Create teams first
```bash
POST /api/event/:id/teams
```

**Step 2:** Then add candidates with team assignments
```bash
POST /api/event/:id/candidates
```

**Example Error if teams don't exist:**
```json
{
  "error": "Invalid team names: Team Alpha, Team Beta. Please add these teams first using the teams endpoint."
}
```

---

## 👥 Teams Management

### 9. Get Event Teams
**GET** `/api/event/:id/teams`

Get all teams for a specific event. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/talent_show_2024/teams`

**Response (200 OK):**
```json
{
  "eventId": "talent_show_2024",
  "teams": [
    {
      "id": "auto-generated-id-1",
      "name": "Team Alpha",
      "description": "The alpha team for music competitions",
      "createdAt": "2025-09-20T10:30:00.000Z"
    },
    {
      "id": "auto-generated-id-2",
      "name": "Team Beta", 
      "description": "The beta team for dance competitions",
      "createdAt": "2025-09-20T10:35:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404` - Event not found
- `500` - Internal server error

---

### 10. Add Teams to Event
**POST** `/api/event/:id/teams`

Add teams to a specific event. **Requires Authentication (Admin)**

**💡 Note:** Teams must be created before adding candidates, as each candidate must be assigned to a team.

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `id` - Event ID

**Request Body:**
```json
{
  "teams": [
    {
      "name": "Team Alpha",
      "description": "The alpha team for competitive events"
    },
    {
      "name": "Team Beta",
      "description": "The beta team for creative performances"
    }
  ]
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `teams` | array | Yes | Array of team objects |
| `teams[].name` | string | Yes | Team name (must be unique within event) |
| `teams[].description` | string | No | Optional team description |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Teams added ✅"
}
```

**Error Responses:**
- `400` - Missing required fields or duplicate team names
- `401` - No token provided
- `403` - Invalid or expired token
- `404` - Event not found
- `500` - Internal server error

---

## 🎯 Programs Management

### 11. Get Event Programs
**GET** `/api/event/:id/programs`

Get all programs for a specific event. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/talent_show_2024/programs`

**Response (200 OK):**
```json
[
  {
    "id": "program_id_1",
    "title": "Singing Competition",
    "candidates": [
      {
        "name": "Alice Johnson",
        "team": "Team Alpha"
      },
      {
        "name": "Charlie Brown",
        "team": "Team Beta"
      }
    ],
    "results": {
      "Alice Johnson": "1st Place",
      "Charlie Brown": "2nd Place"
    },
    "createdAt": "2025-09-20T10:45:00.000Z"
  }
]
```

**Error Responses:**
- `404` - No programs found for this event
- `500` - Internal server error

---

### 12. Add Program to Event
**POST** `/api/event/:id/programs`

Add a program to a specific event. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `id` - Event ID

**Request Body:**
```json
{
  "title": "Dance Competition",
  "candidates": [
    {
      "name": "Bob Smith",
      "team": "Team Alpha"
    },
    {
      "name": "Diana Prince", 
      "team": "Team Beta"
    }
  ],
  "results": {
    "Bob Smith": "1st Place",
    "Diana Prince": "2nd Place"
  }
}
```

**Note:** Results are optional when creating a program. You can add results later using the PATCH endpoint.

**Response (201 Created):**
```json
{
  "message": "Program added successfully",
  "program": {
    "id": "auto-generated-program-id",
    "title": "Dance Competition",
    "candidates": [
      {
        "name": "Bob Smith",
        "team": "Team Alpha"
      },
      {
        "name": "Diana Prince",
        "team": "Team Beta"
      }
    ],
    "results": {
      "Bob Smith": "1st Place",
      "Diana Prince": "2nd Place"
    },
    "createdAt": "2025-09-20T11:00:00.000Z"
  }
}
```

**Validation Requirements:**
- `title` is required
- `candidates` must be an array with at least one candidate
- Each candidate must have both `name` and `team` properties
- All candidate names must exist in the event's candidates collection
- All team names must exist in the event's teams collection

**Error Responses:**
- `400` - Title is required
- `400` - Candidates are required and must be an array
- `400` - Each candidate must have both 'name' and 'team' properties
- `400` - Invalid candidates: [candidate_names]
- `400` - Invalid teams: [team_names]
- `401` - No token provided
- `403` - Invalid or expired token
- `500` - Internal server error

---

### 13. Update Program Results (New 1-11 Scoring System)
**PATCH** `/api/event/:eventId/programs/:programId/scores`

Update results for a specific program using the new 1-11 scoring system with automatic position and grade calculation. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `eventId` - Event ID
- `programId` - Program ID

**Request Body:**
```json
{
  "scores": {
    "Alice Johnson": 11,
    "Bob Smith": 10,
    "Charlie Brown": 9,
    "Diana Prince": 8,
    "Eve Wilson": 7,
    "Frank Miller": 6,
    "Grace Lee": 5,
    "Henry Davis": 4,
    "Ivy Chen": 3,
    "Jack Brown": 2,
    "Kate Green": 1
  }
}
```

**New Score-to-Position-Grade Mapping (1-11 System):**
- **11** = 1st Place with A grade
- **10** = 2nd Place with A grade
- **9** = 3rd Place with A grade
- **8** = A grade without position
- **7** = 1st Place with B grade
- **6** = 2nd Place with B grade
- **5** = 3rd Place with B grade
- **4** = B grade without position
- **3** = 1st Place without grade
- **2** = 2nd Place without grade
- **1** = 3rd Place without grade

**Features:**
- New 1-11 scoring system provides more granular control
- Separate A and B grade tracks with positions
- Grade-only awards (scores 8 and 4) for recognition without position
- Position-only awards (scores 3, 2, 1) for ranking without grade
- Automatically calculates positions and grades based on score values
- Preserves team information from program candidates  
- Saves results to both program subcollection and main event results
- Validates that all score candidates exist in the program
- Only accepts valid scores: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1

**Response (200 OK):**
```json
{
  "message": "Program results updated successfully with new scoring system (1-11)",
  "resultsWithPositions": [
    {
      "name": "Alice Johnson",
      "team": "Team Alpha",
      "score": 11,
      "position": "1st Place",
      "grade": "A"
    },
    {
      "name": "Bob Smith",
      "team": "Team Beta",
      "score": 10,
      "position": "2nd Place",
      "grade": "A"
    },
    {
      "name": "Charlie Brown",
      "team": "Team Alpha",
      "score": 9,
      "position": "3rd Place",
      "grade": "A"
    },
    {
      "name": "Diana Prince",
      "team": "Team Beta",
      "score": 8,
      "position": null,
      "grade": "A"
    },
    {
      "name": "Eve Wilson",
      "team": "Team Alpha",
      "score": 7,
      "position": "1st Place",
      "grade": "B"
    },
    {
      "name": "Frank Miller",
      "team": "Team Beta",
      "score": 6,
      "position": "2nd Place",
      "grade": "B"
    },
    {
      "name": "Grace Lee",
      "team": "Team Alpha",
      "score": 5,
      "position": "3rd Place",
      "grade": "B"
    },
    {
      "name": "Henry Davis",
      "team": "Team Beta",
      "score": 4,
      "position": null,
      "grade": "B"
    },
    {
      "name": "Ivy Chen",
      "team": "Team Alpha",
      "score": 3,
      "position": "1st Place",
      "grade": null
    },
    {
      "name": "Jack Brown",
      "team": "Team Beta",
      "score": 2,
      "position": "2nd Place",
      "grade": null
    },
    {
      "name": "Kate Green",
      "team": "Team Alpha",
      "score": 1,
      "position": "3rd Place",
      "grade": null
    }
  ],
  "mainEventResultsAdded": 9,
  "scoringSystem": "Scores 1-11: 11=1st A, 10=2nd A, 9=3rd A, 8=A grade only, 7=1st B, 6=2nd B, 5=3rd B, 4=B grade only, 3=1st only, 2=2nd only, 1=3rd only"
}
```

**New 1-11 Scoring System Logic:**
- Input scores are validated to only accept: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
- Positions and grades are automatically determined by score value using fixed mapping
- No more complex duplicate score handling - each score maps to exactly one result type
- Results are stored in both program subcollection and main event document
- Team information is automatically preserved from program candidates

**Error Responses:**
- `400` - Scores are required
- `400` - Scores must be one of: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1. Invalid scores for: [candidate_names]
- `400` - Scores include invalid candidates: [candidate_names]
- `404` - Event not found
- `404` - Program not found
- `401` - No token provided
- `403` - Invalid or expired token
- `500` - Internal server error

---

### 14. Get Specific Event
**GET** `/api/event/:id`

Get details of a specific event. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/talent_show_2024`

**Response (200 OK):**
```json
{
  "id": "talent_show_2024",
  "name": "Annual Talent Show 2024",
  "participants": [],
  "results": [],
  "extraAwards": [],
  "status": "not_published"
}
```

**Error Responses:**
- `404` - Event not found
- `500` - Internal server error

---

## 🏆 Results Management

### 15. Get Event Results
**GET** `/api/event/:id/results`

Get results for a specific event grouped by program name. **Public Access**

**URL Parameters:**
- `id` - Event ID

**Example:** `GET /api/event/{auto_generated_event_id}/results`

**Response Format:**
- Results are grouped by program name as object keys
- Each program contains an array of participant results
- `programName` is removed from individual result objects since it becomes the grouping key

**Response (200 OK):**
```json
{
  "eventId": "summer_music_festival_123456_ab3d",
  "status": "not_published",
  "results": {
    "Singing Competition": [
      {
        "grade": "A",
        "position": 1,
        "participantId": "participant_1",
        "participantName": "Alice Johnson",
        "category": "singing",
        "score": 8
      }
    ],
    "Instrumental": [
      {
        "grade": "B",
        "position": 2,
        "participantId": "participant_2",
        "participantName": "Bob Smith",
        "category": "instrumental",
        "score": 5
      }
    ]
  },
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

### 16. Save Event Results (New 1-11 Scoring System)
**POST** `/api/event/:id/results`

Save results for a specific event using the new 1-11 scoring system. **Requires Authentication (Admin)**

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
      "programName": "Singing Competition",
      "grade": "A",
      "position": 1,
      "participantId": "participant_1",
      "participantName": "Alice Johnson",
      "category": "singing",
      "score": 11
    },
    {
      "programName": "Dance Performance",
      "grade": null,
      "position": 1,
      "participantId": "participant_2",
      "participantName": "Bob Smith",
      "category": "dance",
      "score": 3
    },
    {
      "programName": "Art Contest",
      "grade": "B",
      "position": null,
      "participantId": "participant_3",
      "participantName": "Charlie Brown",
      "category": "art",
      "score": 4
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
  "message": "Results saved (draft) ✅"
}
```

**Validation Requirements (New 1-11 Scoring System):**
- Each result object must include: `programName` (required), `grade` (A/B/null), `position` (1/2/3/null)
- `score` must be an integer and match the new grading table below; if omitted, the server auto-calculates.
- **New Grading Table (1-11 System):**
  - **Grade A + Position 1** = Score 11
  - **Grade A + Position 2** = Score 10
  - **Grade A + Position 3** = Score 9
  - **Grade A + No Position** = Score 8
  - **Grade B + Position 1** = Score 7
  - **Grade B + Position 2** = Score 6
  - **Grade B + Position 3** = Score 5
  - **Grade B + No Position** = Score 4
  - **No Grade + Position 1** = Score 3
  - **No Grade + Position 2** = Score 2
  - **No Grade + Position 3** = Score 1

**Error Responses:**
- `400` - Invalid payload (missing required fields; invalid grade/position combination; score mismatch)
- `400` - Score must match the new 1-11 grading table for the specified grade/position combination
- `401` - No token provided
- `403` - Invalid or expired token
- `404` - Event not found
- `500` - Internal server error

---

### 17. Publish Event Results
**POST** `/api/event/:id/publish-results`

Publish the results for a specific event. **Requires Authentication (Admin)**

**Headers:**
```
Authorization: Bearer YOUR_ID_TOKEN
```

**URL Parameters:**
- `id` - Event ID

**Request Body:** _(empty)_

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results published successfully"
}
```

**What this does:**
- Sets the event's `status` field to `published`.
- Results become visible as published in the API.

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

**📌 Note:** Event IDs are automatically generated by the server. Use the `eventId` returned in step 3 for all subsequent requests.

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
    "name": "Summer Music Festival 2024"
  }'
```
*Response will include auto-generated eventId like: "summer_music_festival_2024_123456_ab3d"*

4. **Get all events:**
```bash
curl http://localhost:5000/api/events
```

5. **Add teams (use the eventId from step 3 response):**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "teams": [
      {
        "name": "Team Alpha",
        "description": "The alpha team for music competitions"
      },
      {
        "name": "Team Beta",
        "description": "The beta team for dance competitions"
      }
    ]
  }'
```

6. **Add candidates:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/candidates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "candidates": [
      {
        "name": "Taylor Swift",
        "id": "taylor_001"
      },
      {
        "name": "Ed Sheeran",
        "id": "ed_002"
      }
    ]
  }'
```

7. **Create a program with candidates and teams:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/programs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Singing Competition",
    "candidates": [
      {
        "name": "Taylor Swift",
        "team": "Team Alpha"
      },
      {
        "name": "Ed Sheeran",
        "team": "Team Beta"
      }
    ]
  }'
```

8. **Update program results with new 1-11 scoring system:**
```bash
curl -X PATCH http://localhost:5000/api/event/{GENERATED_EVENT_ID}/programs/PROGRAM_ID/scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "scores": {
      "Taylor Swift": 11,
      "Ed Sheeran": 10
    }
  }'
```

9. **Get event programs:**
```bash
curl http://localhost:5000/api/event/{GENERATED_EVENT_ID}/programs
```

10. **Save overall event results:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "results": [
      {
        "programName": "Singing Competition",
        "grade": "A",
        "position": 1,
        "participantId": "taylor_001",
        "participantName": "Taylor Swift",
        "category": "singing",
        "score": 11
      },
      {
        "programName": "Instrumental",
        "grade": "B",
        "position": 2,
        "participantId": "ed_002",
        "participantName": "Ed Sheeran",
        "category": "instrumental",
        "score": 6
      }
    ],
    "extraAwards": []
  }'
```

11. **Publish results:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/publish-results \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

12. **View results:**
```bash
curl http://localhost:5000/api/event/{GENERATED_EVENT_ID}/results
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

# Cookie-based Authentication Configuration
CORS_ORIGIN=http://localhost:3000
COOKIE_SAMESITE=Lax
COOKIE_SECURE=false
NODE_ENV=development
```

**Cookie Authentication Variables:**
- `CORS_ORIGIN`: Frontend URL for CORS configuration (e.g., `http://localhost:3000`)
- `COOKIE_SAMESITE`: Cookie SameSite policy (`Lax`, `Strict`, or `None`)
- `COOKIE_SECURE`: Set to `true` for HTTPS in production, `false` for development
- `NODE_ENV`: Environment mode (`development` or `production`)

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
- `POST /api/auth/logout` - Logout (clears cookies)

### Events
- `GET /api/events` - Get all events
- `GET /api/event/:id` - Get specific event details
- `POST /api/events` - Create new event (🔒 Protected)

### Candidates
- `GET /api/event/:id/candidates` - Get event candidates
- `POST /api/event/:id/candidates` - Add candidates (🔒 Protected)

### Teams
- `GET /api/event/:id/teams` - Get event teams
- `POST /api/event/:id/teams` - Add teams (🔒 Protected)

### Programs
- `GET /api/event/:id/programs` - Get event programs
- `POST /api/event/:id/programs` - Add program (🔒 Protected)
- `PATCH /api/event/:eventId/programs/:programId/scores` - Update program results (🔒 Protected)

### Results
- `GET /api/event/:id/results` - Get event results
- `POST /api/event/:id/results` - Save event results (🔒 Protected)
- `POST /api/event/:id/publish-results` - Publish event results (🔒 Protected)

### Testing Scripts
- `node scripts/testFirebaseConfig.js` - Test Firebase configuration
- `node scripts/getToken.js` - Get authentication token for testing

**🔒 Protected** = Requires `Authorization: Bearer TOKEN` header or authenticated cookies (send requests with credentials included)

---

## 🔄 API Workflow Summary

### Modern Workflow (Recommended)
1. **Authentication**: Sign up/Login to get token
2. **Create Event**: POST `/api/events`
3. **Add Teams**: POST `/api/event/:id/teams` **← REQUIRED FIRST**
4. **Add Candidates**: POST `/api/event/:id/candidates` (with team assignments)
5. **Create Programs**: POST `/api/event/:id/programs` (with candidates and teams)
6. **Update Results**: PATCH `/api/event/:eventId/programs/:programId/scores` (score-based)
7. **Publish Results**: POST `/api/event/:eventId/programs/:programId/publish`
8. **View Published Results**: GET `/api/event/:id/published-results`

### Legacy Workflow (Still Supported)
1. **Authentication**: Sign up/Login to get token
2. **Create Event**: POST `/api/events`
3. **Add Teams**: POST `/api/event/:id/teams` **← NOW REQUIRED**
4. **Add Candidates**: POST `/api/event/:id/candidates` (with team assignments)
5. **Save Results**: POST `/api/event/:id/results`
6. **View Results**: GET `/api/event/:id/results`

---

## 🆕 New Features Summary

### Cookie-Based Authentication
- Secure HTTP-only cookies for token storage (`token` and `refreshToken`)
- Automatic token refresh via middleware when tokens expire
- Enhanced CORS configuration with credential support
- Environment-based cookie security settings

### Teams Management
- Create and manage teams for events
- Assign candidates to teams when creating programs
- Teams are stored as subcollections in Firestore

### Enhanced Programs
- Programs now require team assignments for all candidates
- Results are optional during program creation
- **Dual Storage System**: Results are saved to both program subcollection and main event results
- **Team Preservation**: Team information is automatically preserved when updating results
- **Score-Based Results**: Input fixed scores (8, 7, 6, 5) that automatically determine position and grade:
  - Score 8 = 1st Place with A grade
  - Score 7 = 1st Place with B grade (or 2nd Place with A grade)
  - Score 6 = 2nd Place with B grade (or 3rd Place with A grade)  
  - Score 5 = 3rd Place with B grade
- Full validation for candidates and teams
- Intelligent handling of duplicate scores with automatic position assignment
- **Grouped Results**: Event results are now grouped by program name for better organization

### Data Structure Changes
- **Candidates**: Stored in `/events/{eventId}/candidates/{candidateId}`
- **Teams**: Stored in `/events/{eventId}/teams/{teamId}`
- **Programs**: Stored in `/events/{eventId}/programs/{programId}`
- **Results**: Dual storage in program subcollections and main event document

### Validation Improvements
- Strict validation for candidate and team existence
- Enhanced error messages with specific details
- Team requirement validation for program creation
- Score validation for numerical input (scores must be numbers)
