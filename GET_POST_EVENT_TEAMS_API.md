# GET/POST /api/event/:id/teams - Teams Management API Documentation

## Overview
The `/api/event/:id/teams` endpoint provides functionality for managing teams within an event. It supports both retrieving existing teams (GET) and adding new teams (POST) to a specific event.

## Endpoints

### 1. Get Event Teams

**Method:** `GET`  
**URL:** `/api/event/:id/teams`  
**Authentication:** Public (no authentication required)  
**Content-Type:** `application/json`

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

#### Request Example

```bash
GET /api/event/summer_fest_2024/teams
```

```javascript
// Using fetch
const response = await fetch('/api/event/summer_fest_2024/teams');
const data = await response.json();

// Using axios
const response = await axios.get('/api/event/summer_fest_2024/teams');
```

#### Success Response (200 OK)

**Basic Response (No Published Results):**
```json
{
  "eventId": "summer_fest_2024",
  "teams": [
    {
      "id": "team_123",
      "name": "Red Hawks",
      "description": "Competitive team from North District",
      "createdAt": "2024-06-15T10:30:00.000Z",
      "totalScore": 0,
      "resultsCount": 0,
      "programsCount": 0,
      "programs": {}
    },
    {
      "id": "team_456", 
      "name": "Blue Eagles",
      "description": "Creative team specializing in performing arts",
      "createdAt": "2024-06-15T11:00:00.000Z",
      "totalScore": 0,
      "resultsCount": 0,
      "programsCount": 0,
      "programs": {}
    }
  ],
  "totalPublishedPrograms": 0,
  "totalResults": 0,
  "summary": {
    "totalTeams": 2,
    "teamsWithResults": 0,
    "programsWithResults": 0
  }
}
```

**Enhanced Response (With Published Results):**
```json
{
  "eventId": "summer_fest_2024",
  "teams": [
    {
      "id": "team_123",
      "name": "Red Hawks",
      "description": "Competitive team from North District", 
      "createdAt": "2024-06-15T10:30:00.000Z",
      "totalScore": 15,
      "resultsCount": 2,
      "programsCount": 1,
      "programs": {
        "Classical Dance": [
          {
            "position": 1,
            "grade": "A",
            "score": 8
          },
          {
            "position": 2,
            "grade": "A",
            "score": 7
          }
        ]
      }
    },
    {
      "id": "team_456",
      "name": "Blue Eagles",
      "description": "Creative team specializing in performing arts",
      "createdAt": "2024-06-15T11:00:00.000Z", 
      "totalScore": 11,
      "resultsCount": 2,
      "programsCount": 1,
      "programs": {
        "Classical Dance": [
          {
            "position": 3,
            "grade": "B", 
            "score": 6
          },
          {
            "position": 3,
            "grade": "B",
            "score": 5
          }
        ]
      }
    }
  ],
  "totalPublishedPrograms": 1,
  "totalResults": 4,
  "summary": {
    "totalTeams": 2,
    "teamsWithResults": 2,
    "programsWithResults": 1
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | The ID of the event |
| `teams` | array | Array of team objects with calculated scores |
| `teams[].id` | string | Unique identifier of the team |
| `teams[].name` | string | Name of the team |
| `teams[].description` | string | Optional description of the team |
| `teams[].createdAt` | string | ISO timestamp when team was created |
| `teams[].totalScore` | number | **Total score from all published program results** |
| `teams[].resultsCount` | number | **Number of individual results this team has** |
| `teams[].programsCount` | number | **Number of unique programs this team participated in** |
| `teams[].programs` | object | **Results grouped by program name** |
| `teams[].programs[programName]` | array | **Array of results for this program** |
| `teams[].programs[programName][].position` | number | Position achieved (1, 2, 3) |
| `teams[].programs[programName][].grade` | string | Grade category ("A" or "B") |
| `teams[].programs[programName][].score` | number | Points scored for this result |
| `totalPublishedPrograms` | number | **Total number of published programs** |
| `totalResults` | number | **Total number of individual results across all teams** |
| `summary` | object | **Summary statistics** |
| `summary.totalTeams` | number | Total number of teams in the event |
| `summary.teamsWithResults` | number | Number of teams that have results |
| `summary.programsWithResults` | number | Number of programs with published results |

#### Key Features

✅ **Automatic Score Calculation:** Scores are calculated from published program results only  
✅ **Program Grouping:** Results are grouped by program name to avoid confusion  
✅ **Smart Counting:** `programsCount` shows unique programs, not individual results  
✅ **Comprehensive Stats:** Summary section provides event-wide statistics  
✅ **Real-time Updates:** Scores update automatically when programs are published

#### Error Responses

**500 Internal Server Error**
```json
{
  "error": "Internal server error message"
}
```

---

### 2. Add Teams to Event

**Method:** `POST`  
**URL:** `/api/event/:id/teams`  
**Authentication:** Required (Admin only)  
**Content-Type:** `application/json`

#### Headers

```
Authorization: Bearer YOUR_ID_TOKEN
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

#### Request Body

The request body accepts teams in two formats:

**Format 1: Direct array**
```json
[
  {
    "name": "Red Hawks",
    "description": "Competitive team from North District",
    "id": "custom_team_id_1"
  },
  {
    "name": "Blue Eagles", 
    "description": "Creative team specializing in performing arts"
  },
  {
    "name": "Green Lions"
  }
]
```

**Format 2: Wrapped in teams object**
```json
{
  "teams": [
    {
      "name": "Red Hawks",
      "description": "Competitive team from North District"
    },
    {
      "name": "Blue Eagles",
      "description": "Creative team specializing in performing arts"
    }
  ]
}
```

#### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the team (must be non-empty) |
| `description` | string | No | Optional description of the team |
| `id` | string | No | Custom ID for the team (auto-generated if not provided) |

#### Request Examples

```bash
curl -X POST /api/event/summer_fest_2024/teams \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Red Hawks",
      "description": "Competitive team from North District"
    },
    {
      "name": "Blue Eagles",
      "description": "Creative team specializing in performing arts"
    }
  ]'
```

```javascript
// Using fetch
const response = await fetch('/api/event/summer_fest_2024/teams', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ID_TOKEN',
    'Content-Type': 'application/json',
    'credentials': 'include' // For cookie-based auth
  },
  body: JSON.stringify([
    {
      name: "Red Hawks",
      description: "Competitive team from North District"
    },
    {
      name: "Blue Eagles", 
      description: "Creative team specializing in performing arts"
    }
  ])
});

// Using axios
const response = await axios.post('/api/event/summer_fest_2024/teams', [
  {
    name: "Red Hawks",
    description: "Competitive team from North District"
  },
  {
    name: "Blue Eagles",
    description: "Creative team specializing in performing arts"
  }
], {
  headers: {
    'Authorization': 'Bearer YOUR_ID_TOKEN'
  }
});
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Teams added ✅"
}
```

#### Error Responses

**400 Bad Request - Invalid Input**
```json
{
  "error": "Teams must be sent as an array"
}
```

```json
{
  "error": "At least one team is required"
}
```

```json
{
  "error": "Each team must have a name"
}
```

**401 Unauthorized**
```json
{
  "error": "No token provided"
}
```

**403 Forbidden**
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found**
```json
{
  "error": "Event not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to add teams"
}
```

**504 Gateway Timeout**
```json
{
  "error": "Add teams commit timeout after 15000ms"
}
```

## Implementation Details

### Data Storage
- Teams are stored in a subcollection: `events/{eventId}/teams/{teamId}`
- Each team document contains: `id`, `name`, `description`, `createdAt`
- Team IDs are auto-generated if not provided in the request

### Validation Rules
1. **Team Name**: Required, must be a non-empty string
2. **Description**: Optional, defaults to empty string if not provided
3. **Array Format**: Teams must be provided as an array
4. **Event Existence**: Event must exist before adding teams
5. **Authentication**: POST requests require valid admin authentication

### Timeouts
- Event fetch timeout: 10 seconds
- Team addition batch commit timeout: 15 seconds
- Timeout errors return 504 status code

### Batch Operations
- Teams are added using Firestore batch operations for atomicity
- All teams in a single request succeed or fail together

## Frontend Integration Examples

### React Component

```javascript
import React, { useState, useEffect } from 'react';

function TeamManager({ eventId }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });

  // Fetch existing teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${eventId}/teams`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        const data = await response.json();
        setTeams(data.teams);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [eventId]);

  // Add new team
  const addTeam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`/api/event/${eventId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify([newTeam])
      });

      if (!response.ok) throw new Error('Failed to add team');
      
      // Refresh teams list
      const teamsResponse = await fetch(`/api/event/${eventId}/teams`);
      const data = await teamsResponse.json();
      setTeams(data.teams);
      setNewTeam({ name: '', description: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Teams Management</h2>
      
      {error && <div className="error">Error: {error}</div>}
      
      {/* Add Team Form */}
      <form onSubmit={addTeam}>
        <input
          type="text"
          placeholder="Team Name"
          value={newTeam.name}
          onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newTeam.description}
          onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Team'}
        </button>
      </form>

      {/* Teams List */}
      <div>
        <h3>Existing Teams</h3>
        {loading && <div>Loading teams...</div>}
        <ul>
          {teams.map((team) => (
            <li key={team.id}>
              <strong>{team.name}</strong>
              {team.description && <p>{team.description}</p>}
              <small>Created: {new Date(team.createdAt).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TeamManager;
```

### Vue.js Component

```vue
<template>
  <div>
    <h2>Teams Management</h2>
    
    <div v-if="error" class="error">Error: {{ error }}</div>
    
    <!-- Add Team Form -->
    <form @submit.prevent="addTeam">
      <input
        v-model="newTeam.name"
        type="text"
        placeholder="Team Name"
        required
      />
      <input
        v-model="newTeam.description"
        type="text"
        placeholder="Description (optional)"
      />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Adding...' : 'Add Team' }}
      </button>
    </form>

    <!-- Teams List -->
    <div>
      <h3>Existing Teams</h3>
      <div v-if="loading">Loading teams...</div>
      <ul v-else>
        <li v-for="team in teams" :key="team.id">
          <strong>{{ team.name }}</strong>
          <p v-if="team.description">{{ team.description }}</p>
          <small>Created: {{ formatDate(team.createdAt) }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  props: ['eventId'],
  data() {
    return {
      teams: [],
      loading: false,
      error: null,
      newTeam: { name: '', description: '' }
    };
  },
  async mounted() {
    await this.fetchTeams();
  },
  methods: {
    async fetchTeams() {
      try {
        this.loading = true;
        const response = await fetch(`/api/event/${this.eventId}/teams`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        const data = await response.json();
        this.teams = data.teams;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async addTeam() {
      try {
        this.loading = true;
        const response = await fetch(`/api/event/${this.eventId}/teams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify([this.newTeam])
        });

        if (!response.ok) throw new Error('Failed to add team');
        
        await this.fetchTeams();
        this.newTeam = { name: '', description: '' };
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>
```

## Bulk Operations Example

For adding multiple teams at once:

```javascript
const bulkAddTeams = async (eventId, teamsList) => {
  try {
    const response = await fetch(`/api/event/${eventId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(teamsList)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add teams');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding teams:', error);
    throw error;
  }
};

// Usage
const teamsToAdd = [
  { name: "Red Hawks", description: "North District team" },
  { name: "Blue Eagles", description: "South District team" },
  { name: "Green Lions", description: "East District team" },
  { name: "Yellow Falcons", description: "West District team" }
];

bulkAddTeams('summer_fest_2024', teamsToAdd)
  .then(result => console.log('Teams added successfully:', result))
  .catch(error => console.error('Failed to add teams:', error));
```

## Related Endpoints

- `GET /api/event/:id` - Get basic event information
- `GET /api/event/:id/candidates` - Get event candidates
- `POST /api/event/:id/candidates` - Add candidates to event
- `GET /api/event/:id/programs` - Get event programs
- `POST /api/event/:id/programs` - Create programs (requires teams and candidates)
- `GET /api/event/:id/results` - Get event results (includes team information)

## Best Practices

1. **Error Handling**: Always handle both network errors and API error responses
2. **Loading States**: Show loading indicators during API calls
3. **Validation**: Validate team names on the frontend before submission
4. **Batch Operations**: Add multiple teams in a single request for better performance
5. **Authentication**: Store and manage authentication tokens securely
6. **Refresh Data**: Refresh the teams list after successful additions

## Changelog

### Version 1.1 (Current)
- Added support for both direct array and wrapped object request formats
- Improved error handling with specific timeout detection
- Enhanced validation for team data
- Added auto-generated team IDs when not provided

### Version 1.0
- Initial implementation with basic team management
- GET and POST endpoints for teams
- Firebase subcollection storage structure