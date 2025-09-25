# GET/POST /api/event/:id/candidates - Candidates Management API Documentation

## Overview
The `/api/event/:id/candidates` endpoint provides functionality for managing candidates (participants) within an event. It supports both retrieving existing candidates (GET) and adding new candidates (POST) to a specific event. **All candidates must be assigned to existing teams.**

## Endpoints

### 1. Get Event Candidates

**Method:** `GET`  
**URL:** `/api/event/:id/candidates`  
**Authentication:** Public (no authentication required)  
**Content-Type:** `application/json`

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

#### Request Example

```bash
GET /api/event/talent_show_2024/candidates
```

```javascript
// Using fetch
const response = await fetch('/api/event/talent_show_2024/candidates');
const data = await response.json();

// Using axios
const response = await axios.get('/api/event/talent_show_2024/candidates');
```

#### Success Response (200 OK)

```json
{
  "eventId": "talent_show_2024",
  "candidates": [
    {
      "id": "candidate_001",
      "name": "Alice Johnson",
      "team": "Team Alpha",
      "id": "alice_001"
    },
    {
      "id": "candidate_002",
      "name": "Bob Smith",
      "team": "Team Beta",
      "id": "bob_002"
    },
    {
      "id": "candidate_003",
      "name": "Charlie Brown",
      "team": "Team Alpha",
      "id": "charlie_003"
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | ID of the event |
| `candidates` | array | List of all candidates in the event |
| `candidates[].id` | string | Unique candidate identifier (auto-generated) |
| `candidates[].name` | string | Candidate's full name |
| `candidates[].team` | string | Team the candidate belongs to |

#### Error Responses

**404 Not Found**
```json
{
  "error": "Event not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

### 2. Add Candidates to Event

**Method:** `POST`  
**URL:** `/api/event/:id/candidates`  
**Authentication:** Required (Admin only)  
**Content-Type:** `application/json`

**⚠️ Important:** Each candidate must be assigned to an existing team. Teams must be created first using `POST /api/event/:id/teams`.

#### Headers

```
Authorization: Bearer YOUR_ID_TOKEN
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

#### Request Body

```json
{
  "candidates": [
    {
      "name": "Alice Johnson",
      "team": "Team Alpha",
      "id": "alice_001"
    },
    {
      "name": "Bob Smith",
      "team": "Team Beta",
      "id": "bob_002"
    },
    {
      "name": "Charlie Brown",
      "team": "Team Alpha"
    }
  ]
}
```

#### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `candidates` | array | Yes | Array of candidate objects |
| `candidates[].name` | string | Yes | Candidate's full name (must be unique within event) |
| `candidates[].team` | string | Yes | Team name (must exist in teams collection) |
| `candidates[].id` | string | No | Optional custom ID for the candidate |

#### Request Examples

```bash
curl -X POST /api/event/talent_show_2024/candidates \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidates": [
      {
        "name": "Alice Johnson",
        "team": "Team Alpha",
        "id": "alice_001"
      },
      {
        "name": "Bob Smith",
        "team": "Team Beta"
      }
    ]
  }'
```

```javascript
// Using fetch
const response = await fetch('/api/event/talent_show_2024/candidates', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ID_TOKEN',
    'Content-Type': 'application/json',
    'credentials': 'include' // For cookie-based auth
  },
  body: JSON.stringify({
    candidates: [
      {
        name: "Alice Johnson",
        team: "Team Alpha",
        id: "alice_001"
      },
      {
        name: "Bob Smith",
        team: "Team Beta"
      }
    ]
  })
});

// Using axios
const response = await axios.post('/api/event/talent_show_2024/candidates', {
  candidates: [
    {
      name: "Alice Johnson",
      team: "Team Alpha",
      id: "alice_001"
    },
    {
      name: "Bob Smith",
      team: "Team Beta"
    }
  ]
}, {
  headers: {
    'Authorization': 'Bearer YOUR_ID_TOKEN'
  }
});
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Candidates added ✅"
}
```

#### Error Responses

**400 Bad Request - Missing Required Fields**
```json
{
  "error": "Candidate[0] must include a non-empty 'name'"
}
```

```json
{
  "error": "Candidate[1] must include a non-empty 'team'"
}
```

**400 Bad Request - Invalid Team Names**
```json
{
  "error": "Invalid team names: Team Zeta, Team Omega. Please add these teams first using the teams endpoint."
}
```

**400 Bad Request - Duplicate Candidate Names**
```json
{
  "error": "Duplicate candidate names in payload: Alice Johnson, Bob Smith"
}
```

```json
{
  "error": "Candidate names already exist: Charlie Brown, Diana Prince"
}
```

**400 Bad Request - Invalid Input Format**
```json
{
  "error": "Candidates are required and must be a non-empty array"
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
  "error": "Failed to add candidates"
}
```

## Required Workflow

### ⚠️ Prerequisites

**Step 1:** Create teams first
```bash
POST /api/event/:id/teams
```

**Step 2:** Then add candidates with team assignments
```bash
POST /api/event/:id/candidates
```

### Workflow Example

```javascript
// 1. First, create teams
const teamsResponse = await fetch('/api/event/talent_show_2024/teams', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([
    { name: "Team Alpha", description: "Creative performers" },
    { name: "Team Beta", description: "Musical talents" }
  ])
});

// 2. Then, add candidates with team assignments
const candidatesResponse = await fetch('/api/event/talent_show_2024/candidates', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    candidates: [
      { name: "Alice Johnson", team: "Team Alpha" },
      { name: "Bob Smith", team: "Team Beta" }
    ]
  })
});
```

## Implementation Details

### Data Storage
- Candidates are stored in a subcollection: `events/{eventId}/candidates/{candidateId}`
- Each candidate document contains: `name`, `team`, `id`
- Candidate IDs are auto-generated if not provided in the request

### Validation Rules
1. **Candidate Name**: Required, must be a non-empty string, unique within event
2. **Team Assignment**: Required, team must exist in the event's teams collection
3. **Array Format**: Candidates must be provided as an array
4. **Event Existence**: Event must exist before adding candidates
5. **Authentication**: POST requests require valid admin authentication
6. **No Duplicates**: Candidate names must be unique within the event (case-insensitive)

### Team Validation Process
1. Fetches all existing teams for the event
2. Validates each candidate's team assignment against existing teams
3. Returns specific error messages for invalid team names
4. Suggests using the teams endpoint to add missing teams

### Duplicate Prevention
- **Within Request**: Prevents duplicate names in the same request
- **Against Existing**: Checks against already stored candidates
- **Case Insensitive**: "John Doe" and "john doe" are considered duplicates

## Frontend Integration Examples

### React Component

```javascript
import React, { useState, useEffect } from 'react';

function CandidateManager({ eventId }) {
  const [candidates, setCandidates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newCandidate, setNewCandidate] = useState({ name: '', team: '' });

  // Fetch existing candidates and teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch candidates
        const candidatesResponse = await fetch(`/api/event/${eventId}/candidates`);
        if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates');
        const candidatesData = await candidatesResponse.json();
        setCandidates(candidatesData.candidates);

        // Fetch teams
        const teamsResponse = await fetch(`/api/event/${eventId}/teams`);
        if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.teams);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // Add new candidate
  const addCandidate = async (e) => {
    e.preventDefault();
    
    if (!newCandidate.name.trim() || !newCandidate.team) {
      setError('Both name and team are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/event/${eventId}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          candidates: [newCandidate]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add candidate');
      }
      
      // Refresh candidates list
      const candidatesResponse = await fetch(`/api/event/${eventId}/candidates`);
      const data = await candidatesResponse.json();
      setCandidates(data.candidates);
      setNewCandidate({ name: '', team: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group candidates by team
  const candidatesByTeam = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.team]) {
      acc[candidate.team] = [];
    }
    acc[candidate.team].push(candidate);
    return acc;
  }, {});

  return (
    <div>
      <h2>Candidates Management</h2>
      
      {error && <div className="error">Error: {error}</div>}
      
      {/* Add Candidate Form */}
      <form onSubmit={addCandidate}>
        <input
          type="text"
          placeholder="Candidate Name"
          value={newCandidate.name}
          onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
          required
        />
        <select
          value={newCandidate.team}
          onChange={(e) => setNewCandidate({...newCandidate, team: e.target.value})}
          required
        >
          <option value="">Select Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.name}>
              {team.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Candidate'}
        </button>
      </form>

      {/* Candidates List Grouped by Team */}
      <div>
        <h3>Candidates by Team</h3>
        {loading && <div>Loading candidates...</div>}
        
        {Object.entries(candidatesByTeam).map(([teamName, teamCandidates]) => (
          <div key={teamName} style={{ marginBottom: '20px' }}>
            <h4>{teamName} ({teamCandidates.length} members)</h4>
            <ul>
              {teamCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <strong>{candidate.name}</strong>
                  <small> (ID: {candidate.id})</small>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {candidates.length === 0 && !loading && (
          <p>No candidates added yet. Add some candidates to get started!</p>
        )}
      </div>
    </div>
  );
}

export default CandidateManager;
```

### Vue.js Component

```vue
<template>
  <div>
    <h2>Candidates Management</h2>
    
    <div v-if="error" class="error">Error: {{ error }}</div>
    
    <!-- Add Candidate Form -->
    <form @submit.prevent="addCandidate">
      <input
        v-model="newCandidate.name"
        type="text"
        placeholder="Candidate Name"
        required
      />
      <select v-model="newCandidate.team" required>
        <option value="">Select Team</option>
        <option v-for="team in teams" :key="team.id" :value="team.name">
          {{ team.name }}
        </option>
      </select>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Adding...' : 'Add Candidate' }}
      </button>
    </form>

    <!-- Candidates List -->
    <div>
      <h3>Candidates by Team</h3>
      <div v-if="loading">Loading candidates...</div>
      
      <div v-for="[teamName, teamCandidates] in Object.entries(candidatesByTeam)" 
           :key="teamName" class="team-group">
        <h4>{{ teamName }} ({{ teamCandidates.length }} members)</h4>
        <ul>
          <li v-for="candidate in teamCandidates" :key="candidate.id">
            <strong>{{ candidate.name }}</strong>
            <small> (ID: {{ candidate.id }})</small>
          </li>
        </ul>
      </div>

      <p v-if="candidates.length === 0 && !loading">
        No candidates added yet. Add some candidates to get started!
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['eventId'],
  data() {
    return {
      candidates: [],
      teams: [],
      loading: false,
      error: null,
      newCandidate: { name: '', team: '' }
    };
  },
  computed: {
    candidatesByTeam() {
      return this.candidates.reduce((acc, candidate) => {
        if (!acc[candidate.team]) {
          acc[candidate.team] = [];
        }
        acc[candidate.team].push(candidate);
        return acc;
      }, {});
    }
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        this.loading = true;
        
        // Fetch candidates
        const candidatesResponse = await fetch(`/api/event/${this.eventId}/candidates`);
        if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates');
        const candidatesData = await candidatesResponse.json();
        this.candidates = candidatesData.candidates;

        // Fetch teams
        const teamsResponse = await fetch(`/api/event/${this.eventId}/teams`);
        if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
        const teamsData = await teamsResponse.json();
        this.teams = teamsData.teams;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async addCandidate() {
      if (!this.newCandidate.name.trim() || !this.newCandidate.team) {
        this.error = 'Both name and team are required';
        return;
      }

      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch(`/api/event/${this.eventId}/candidates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            candidates: [this.newCandidate]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add candidate');
        }
        
        await this.fetchData();
        this.newCandidate = { name: '', team: '' };
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.team-group {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.error {
  color: red;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 3px;
  margin-bottom: 10px;
}
</style>
```

## Bulk Operations Example

For adding multiple candidates at once:

```javascript
const bulkAddCandidates = async (eventId, candidatesList) => {
  try {
    const response = await fetch(`/api/event/${eventId}/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        candidates: candidatesList
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add candidates');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding candidates:', error);
    throw error;
  }
};

// Usage
const candidatesToAdd = [
  { name: "Alice Johnson", team: "Team Alpha" },
  { name: "Bob Smith", team: "Team Beta" },
  { name: "Charlie Brown", team: "Team Alpha" },
  { name: "Diana Prince", team: "Team Beta" }
];

bulkAddCandidates('talent_show_2024', candidatesToAdd)
  .then(result => console.log('Candidates added successfully:', result))
  .catch(error => console.error('Failed to add candidates:', error));
```

## Team Assignment Validation Example

```javascript
// Function to validate team assignments before adding candidates
const validateCandidateTeams = async (eventId, candidates) => {
  try {
    // Fetch available teams
    const teamsResponse = await fetch(`/api/event/${eventId}/teams`);
    if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
    const teamsData = await teamsResponse.json();
    
    const availableTeams = teamsData.teams.map(team => team.name);
    
    // Check if all candidate teams exist
    const invalidTeams = candidates
      .map(candidate => candidate.team)
      .filter(team => !availableTeams.includes(team));
    
    if (invalidTeams.length > 0) {
      const uniqueInvalidTeams = [...new Set(invalidTeams)];
      throw new Error(`Invalid teams: ${uniqueInvalidTeams.join(', ')}. Available teams: ${availableTeams.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('Team validation failed:', error);
    throw error;
  }
};

// Usage
const candidatesToValidate = [
  { name: "Alice Johnson", team: "Team Alpha" },
  { name: "Bob Smith", team: "Team Gamma" } // This might be invalid
];

validateCandidateTeams('talent_show_2024', candidatesToValidate)
  .then(() => {
    console.log('All teams are valid');
    // Proceed with adding candidates
  })
  .catch(error => {
    console.error('Validation error:', error.message);
    // Show error to user or prompt to add missing teams
  });
```

## Related Endpoints

- `GET /api/event/:id` - Get basic event information
- `GET /api/event/:id/teams` - Get event teams (required before adding candidates)
- `POST /api/event/:id/teams` - Add teams to event (prerequisite)
- `GET /api/event/:id/programs` - Get event programs
- `POST /api/event/:id/programs` - Create programs (requires candidates and teams)
- `GET /api/event/:id/results` - Get event results (includes candidate and team information)

## Best Practices

1. **Team Validation**: Always ensure teams exist before adding candidates
2. **Error Handling**: Handle both validation errors and API errors gracefully
3. **User Feedback**: Show clear error messages when team assignments are invalid
4. **Data Grouping**: Group candidates by team for better organization in UI
5. **Batch Operations**: Add multiple candidates in a single request for efficiency
6. **Authentication**: Securely manage authentication tokens
7. **Data Refresh**: Refresh candidate lists after successful additions
8. **Form Validation**: Validate input on the frontend before submitting

## Common Integration Patterns

### Progressive Enhancement
```javascript
// 1. Check if teams exist, create if needed
// 2. Add candidates with team assignments
// 3. Create programs with candidates
// 4. Add results for programs

const setupEventParticipants = async (eventId) => {
  try {
    // Step 1: Ensure teams exist
    const teams = await ensureTeamsExist(eventId, requiredTeams);
    
    // Step 2: Add candidates
    const candidates = await addCandidatesWithTeams(eventId, candidatesList);
    
    // Step 3: Create programs
    const programs = await createPrograms(eventId, programsData);
    
    return { teams, candidates, programs };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
};
```

### Error Recovery
```javascript
const addCandidatesWithRetry = async (eventId, candidates) => {
  try {
    return await addCandidates(eventId, candidates);
  } catch (error) {
    if (error.message.includes('Invalid team names')) {
      // Extract missing team names and create them
      const missingTeams = extractMissingTeams(error.message);
      await createMissingTeams(eventId, missingTeams);
      
      // Retry adding candidates
      return await addCandidates(eventId, candidates);
    }
    throw error;
  }
};
```

## Changelog

### Version 1.2 (Current)
- **BREAKING**: Team assignment now required for all candidates
- Added team validation against existing teams collection
- Enhanced error messages with specific validation feedback
- Added workflow documentation for proper team/candidate setup
- Improved duplicate candidate detection (case-insensitive)

### Version 1.1
- Added support for optional custom candidate IDs
- Improved duplicate detection within request payload
- Enhanced error handling with detailed validation messages

### Version 1.0
- Initial implementation with basic candidate management
- GET and POST endpoints for candidates
- Firebase subcollection storage structure