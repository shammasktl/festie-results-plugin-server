# Festie Results Extension - Updated Scoring System API Documentation

## Base URL
```
http://localhost:5000
```

## Overview
This API provides endpoints for managing events, participants (candidates), results, and user authentication for the Festie Results Extension with an **updated scoring system (1-11)**.

---

## 🏆 New Scoring System (1-11)

The scoring system has been updated to provide more granular control over position and grade assignments:

### Score-to-Position-Grade Mapping

| Score | Position | Grade | Description |
|-------|----------|-------|-------------|
| **11** | 1st Place | A | First place with A grade |
| **10** | 2nd Place | A | Second place with A grade |
| **9** | 3rd Place | A | Third place with A grade |
| **8** | None | A | A grade without specific position |
| **7** | 1st Place | B | First place with B grade |
| **6** | 2nd Place | B | Second place with B grade |
| **5** | 3rd Place | B | Third place with B grade |
| **4** | None | B | B grade without specific position |
| **3** | 1st Place | None | First place without grade |
| **2** | 2nd Place | None | Second place without grade |
| **1** | 3rd Place | None | Third place without grade |

### Key Features
- **Flexible Grading**: Separate A and B grade tracks with positions
- **Grade-Only Awards**: Scores 8 and 4 for recognition without position
- **Position-Only Awards**: Scores 3, 2, 1 for ranking without grade
- **Enhanced Scoring Range**: 1-11 scale provides more nuanced results
- **Backward Compatible**: All existing APIs work with new scoring system

---

## 🧭 Updated API Route Summary

| Method | Path | Auth | Purpose |
|-------:|------|------|---------|
| POST | /api/auth/signup | Public | Create a user account |
| POST | /api/auth/login | Public | Login and set cookies |
| POST | /api/auth/refresh | Public | Refresh ID token (via cookie or body) |
| GET | /api/auth/profile | Protected | Current user + events created by user |
| POST | /api/auth/logout | Protected | Clear auth cookies |
| GET | /api/events | Public/Optional | List events (filtered to your events if authenticated) |
| POST | /api/events | Protected | **Create event (auto-generates unique ID)** |
| GET | /api/event/:id | Public | Get event by ID |
| GET | /api/event/:id/candidates | Public | List event candidates |
| POST | /api/event/:id/candidates | Protected | Add candidates to event |
| GET | /api/event/:id/teams | Public | List event teams |
| POST | /api/event/:id/teams | Protected | Add teams to event |
| GET | /api/event/:id/programs | Public | List programs of event |
| POST | /api/event/:id/programs | Protected | Create a program (requires team per candidate) |
| PATCH | /api/event/:eventId/programs/:programId/scores | Protected | **Update program results (1-11 scoring)** |
| GET | /api/event/:id/results | Public | Get event results |
| POST | /api/event/:id/results | Protected | **Save event results (1-11 scoring)** |
| POST | /api/event/:id/publish-results | Protected | Publish event results |
| GET | /api/event/:id/strategic-results | Public | **Strategic results with 1-11 scoring** |

**Legend**: Protected accepts Authorization header or authenticated cookies. Optional auth filters some responses by current user.

---

## 📊 Updated Program Results (Score-Based)

### Update Program Results with New Scoring System
**PATCH** `/api/event/:eventId/programs/:programId/scores`

Update results for a specific program using the new 1-11 scoring system with automatic position and grade calculation.

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

**New Score-to-Result Mapping:**
- **Score 11** → 1st Place with A grade
- **Score 10** → 2nd Place with A grade
- **Score 9** → 3rd Place with A grade
- **Score 8** → A grade only (no position)
- **Score 7** → 1st Place with B grade
- **Score 6** → 2nd Place with B grade
- **Score 5** → 3rd Place with B grade
- **Score 4** → B grade only (no position)
- **Score 3** → 1st Place only (no grade)
- **Score 2** → 2nd Place only (no grade)
- **Score 1** → 3rd Place only (no grade)

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

**Features:**
- Automatically calculates positions and grades based on score values (1-11)
- Preserves team information from program candidates
- Saves results to both program subcollection and main event results
- Handles all scoring combinations intelligently
- Validates that all score candidates exist in the program
- Only accepts valid scores: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

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

## 🏆 Updated Results Management

### Save Event Results with New Scoring System
**POST** `/api/event/:id/results`

Save results for a specific event using the new 1-11 scoring system.

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

**New Validation Rules:**
- Each result object can have: `programName` (required), `grade` (A/B/null), `position` (1/2/3/null)
- `score` must be an integer and match the new grading table:
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

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results saved (draft) ✅"
}
```

**Error Responses:**
- `400` - Invalid payload (missing required fields, invalid grade/position combination, score mismatch)
- `400` - Score must match the new 1-11 grading table for the specified grade/position combination
- `401` - No token provided
- `403` - Invalid or expired token
- `404` - Event not found
- `500` - Internal server error

---

## 📈 Strategic Results with New Scoring System

### Get Strategic Results for Team Ranking
**GET** `/api/event/:id/strategic-results`

Get strategic program recommendations to influence team rankings using the new 1-11 scoring system.

**URL Parameters:**
- `id` - Event ID

**Query Parameters:**
- `raiseTeam` - Team name to help improve ranking (exclusive with lowerTeam)
- `lowerTeam` - Team name to help lower ranking (exclusive with raiseTeam)
- `limit` - Number of programs to recommend (default: 5)

**Example:** `GET /api/event/{event_id}/strategic-results?raiseTeam=Team%20Alpha&limit=3`

**Response (200 OK):**
```json
{
  "eventId": "summer_music_festival_123456_ab3d",
  "strategy": "raiseTeam",
  "targetTeam": "Team Alpha",
  "currentTeamScores": {
    "Team Alpha": 45,
    "Team Beta": 52,
    "Team Gamma": 38
  },
  "currentRankings": [
    { "team": "Team Beta", "score": 52, "rank": 1 },
    { "team": "Team Alpha", "score": 45, "rank": 2 },
    { "team": "Team Gamma", "score": 38, "rank": 3 }
  ],
  "recommendedPrograms": [
    {
      "id": "program_1",
      "title": "Solo Performance",
      "teamScore": 21,
      "team_results": [
        {
          "name": "Alice Johnson",
          "team": "Team Alpha",
          "score": 11,
          "position": "1st Place",
          "grade": "A"
        },
        {
          "name": "Bob Wilson",
          "team": "Team Alpha", 
          "score": 8,
          "position": null,
          "grade": "A"
        },
        {
          "name": "Charlie Davis",
          "team": "Team Alpha",
          "score": 2,
          "position": "2nd Place",
          "grade": null
        }
      ]
    }
  ],
  "projectedTeamScores": {
    "Team Alpha": 66,
    "Team Beta": 52,
    "Team Gamma": 38
  },
  "projectedRankings": [
    { "team": "Team Alpha", "score": 66, "rank": 1 },
    { "team": "Team Beta", "score": 52, "rank": 2 },
    { "team": "Team Gamma", "score": 38, "rank": 3 }
  ],
  "rankingChange": {
    "current": 2,
    "projected": 1,
    "change": 1,
    "direction": "improved"
  },
  "totalPrograms": 15,
  "publishedPrograms": 8,
  "unpublishedPrograms": 7,
  "analysisMetadata": {
    "scoringSystem": "1-11 scale",
    "maxPossibleScore": 11,
    "minPossibleScore": 1,
    "strategy": "Prioritizing programs where Team Alpha has highest scores"
  }
}
```

**Strategic Logic with New Scoring System:**
- **Raise Team Strategy**: Prioritizes programs where the target team has high scores (9-11)
- **Lower Team Strategy**: Prioritizes programs where other teams have high scores, limiting the target team's advantage
- **Score Impact**: Higher scores (11, 10, 9) have more strategic value than lower scores
- **Team Ranking**: Uses total accumulated scores from published programs

---

## 📝 Complete Workflow Example with New Scoring System

### End-to-End Example Using 1-11 Scoring

**📌 Note:** Event IDs are automatically generated by the server. Use the `eventId` returned in the create event response for all subsequent requests.

1. **Create user account and login** (same as before)

2. **Create event with auto-generated ID:**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Advanced Talent Festival 2024"
  }'
```

3. **Add teams:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "teams": [
      {
        "name": "Team Alpha",
        "description": "Advanced performance team"
      },
      {
        "name": "Team Beta",
        "description": "Creative arts team"
      },
      {
        "name": "Team Gamma",
        "description": "Traditional arts team"
      }
    ]
  }'
```

4. **Add candidates with team assignments:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/candidates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "candidates": [
      {
        "name": "Alice Johnson",
        "team": "Team Alpha"
      },
      {
        "name": "Bob Smith",
        "team": "Team Beta"
      },
      {
        "name": "Charlie Brown",
        "team": "Team Gamma"
      },
      {
        "name": "Diana Prince",
        "team": "Team Alpha"
      },
      {
        "name": "Eve Wilson",
        "team": "Team Beta"
      }
    ]
  }'
```

5. **Create program:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/programs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Grand Performance Competition",
    "candidates": [
      {
        "name": "Alice Johnson",
        "team": "Team Alpha"
      },
      {
        "name": "Bob Smith",
        "team": "Team Beta"
      },
      {
        "name": "Charlie Brown",
        "team": "Team Gamma"
      },
      {
        "name": "Diana Prince",
        "team": "Team Alpha"
      },
      {
        "name": "Eve Wilson",
        "team": "Team Beta"
      }
    ]
  }'
```

6. **Update program results with new 1-11 scoring:**
```bash
curl -X PATCH http://localhost:5000/api/event/{GENERATED_EVENT_ID}/programs/{PROGRAM_ID}/scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "scores": {
      "Alice Johnson": 11,
      "Bob Smith": 10,
      "Charlie Brown": 9,
      "Diana Prince": 7,
      "Eve Wilson": 6
    }
  }'
```

7. **Get strategic recommendations:**
```bash
curl http://localhost:5000/api/event/{GENERATED_EVENT_ID}/strategic-results?raiseTeam=Team%20Beta&limit=3
```

8. **Save overall event results with new scoring:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "results": [
      {
        "programName": "Grand Performance Competition",
        "grade": "A",
        "position": 1,
        "participantId": "alice_001",
        "participantName": "Alice Johnson",
        "category": "performance",
        "score": 11
      },
      {
        "programName": "Grand Performance Competition",
        "grade": "A",
        "position": 2,
        "participantId": "bob_002",
        "participantName": "Bob Smith",
        "category": "performance",
        "score": 10
      },
      {
        "programName": "Grand Performance Competition",
        "grade": "A",
        "position": 3,
        "participantId": "charlie_003",
        "participantName": "Charlie Brown",
        "category": "performance",
        "score": 9
      },
      {
        "programName": "Grand Performance Competition",
        "grade": "B",
        "position": 1,
        "participantId": "diana_004",
        "participantName": "Diana Prince",
        "category": "performance",
        "score": 7
      },
      {
        "programName": "Grand Performance Competition",
        "grade": "B",
        "position": 2,
        "participantId": "eve_005",
        "participantName": "Eve Wilson",
        "category": "performance",
        "score": 6
      }
    ],
    "extraAwards": [
      {
        "award": "Best Overall Performance",
        "participantId": "alice_001",
        "participantName": "Alice Johnson"
      }
    ]
  }'
```

9. **Publish results:**
```bash
curl -X POST http://localhost:5000/api/event/{GENERATED_EVENT_ID}/publish-results \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Migration Guide

### Changes from Old System (8,7,6,5) to New System (1-11)

**Old System Mapping:**
- Score 8 = 1st Place A grade
- Score 7 = 1st Place B grade
- Score 6 = 2nd Place B grade  
- Score 5 = 3rd Place B grade

**New System Mapping:**
- Score 11 = 1st Place A grade
- Score 10 = 2nd Place A grade
- Score 9 = 3rd Place A grade
- Score 8 = A grade only
- Score 7 = 1st Place B grade
- Score 6 = 2nd Place B grade
- Score 5 = 3rd Place B grade
- Score 4 = B grade only
- Score 3 = 1st Place only
- Score 2 = 2nd Place only
- Score 1 = 3rd Place only

### API Compatibility
- ✅ All existing endpoints work with new scoring system
- ✅ Existing data is preserved and continues to work
- ✅ New scoring features are additive, not breaking
- ✅ Enhanced validation provides better error messages

### Key Improvements
1. **More Granular Control**: Separate A and B grade tracks
2. **Flexible Recognition**: Grade-only and position-only awards
3. **Enhanced Range**: 1-11 scale for more precise scoring
4. **Better Strategic Planning**: More sophisticated team ranking strategies
5. **Improved Documentation**: Comprehensive examples and error handling

---

## 🚀 Quick Reference - New Scoring System

### Score Quick Reference Table
```
Score | Position | Grade | Use Case
------|----------|-------|----------
11    | 1st      | A     | Top performer with highest grade
10    | 2nd      | A     | Excellent performance, high grade
9     | 3rd      | A     | Good performance, high grade
8     | None     | A     | High grade recognition only
7     | 1st      | B     | Top performer with good grade
6     | 2nd      | B     | Good performance, good grade
5     | 3rd      | B     | Decent performance, good grade
4     | None     | B     | Good grade recognition only
3     | 1st      | None  | Top placement without grade
2     | 2nd      | None  | Second placement without grade
1     | 3rd      | None  | Third placement without grade
```

### Validation Quick Check
- **Valid Scores**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Valid Positions**: 1, 2, 3, null
- **Valid Grades**: "A", "B", null
- **Score Must Match**: Position + Grade combination

---

This documentation covers all the key changes and provides comprehensive examples for using the new 1-11 scoring system across all API endpoints.