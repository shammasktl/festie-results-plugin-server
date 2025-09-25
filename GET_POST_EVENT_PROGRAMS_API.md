# GET/POST /api/event/:id/programs - Programs Management API Documentation

## Overview
The `/api/event/:id/programs` endpoint provides functionality for managing programs within an event. It supports both retrieving existing programs (GET) and adding new programs (POST) to a specific event. **When creating programs, candidate teams are automatically populated from the candidates database.**

## Endpoints

### 1. Get Event Programs

**Method:** `GET`  
**URL:** `/api/event/:id/programs`  
**Authentication:** Public (no authentication required)  
**Content-Type:** `application/json`

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

#### Request Example

```bash
GET /api/event/cultural_fest_2024/programs
```

```javascript
// Using fetch
const response = await fetch('/api/event/cultural_fest_2024/programs');
const data = await response.json();

// Using axios
const response = await axios.get('/api/event/cultural_fest_2024/programs');
```

#### Success Response (200 OK)

```json
[
  {
    "id": "program_001",
    "title": "Classical Dance",
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
      }
    ],
    "results": null,
    "status": "active",
    "createdAt": "2024-06-15T10:30:00.000Z"
  },
  {
    "id": "program_002",
    "title": "Modern Dance",
    "candidates": [
      {
        "name": "Charlie Brown",
        "team": "Team Alpha",
        "id": "charlie_003"
      }
    ],
    "results": [
      {
        "name": "Charlie Brown",
        "team": "Team Alpha",
        "score": 8,
        "position": "1st Place",
        "grade": "A"
      }
    ],
    "status": "published",
    "createdAt": "2024-06-15T11:00:00.000Z",
    "publishedAt": "2024-06-15T14:30:00.000Z"
  }
]
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique program identifier |
| `title` | string | Program name/title |
| `candidates` | array | List of participating candidates with auto-populated teams |
| `candidates[].name` | string | Candidate's name |
| `candidates[].team` | string | Candidate's team (automatically populated) |
| `candidates[].id` | string | Candidate's unique ID |
| `results` | array\|null | Program results (null if no results entered) |
| `status` | string | Program status ("active", "published", etc.) |
| `createdAt` | string | ISO timestamp when program was created |
| `publishedAt` | string | ISO timestamp when results were published (if applicable) |

#### Error Responses

**404 Not Found**
```json
{
  "error": "No programs found for this event"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch programs"
}
```

---

### 2. Add Program to Event

**Method:** `POST`  
**URL:** `/api/event/:id/programs`  
**Authentication:** Required (Admin only)  
**Content-Type:** `application/json`

**✨ New Feature:** When you provide candidate names, their team information is automatically fetched from the candidates database and added to the program.

#### Headers

```
Authorization: Bearer YOUR_ID_TOKEN
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

#### Request Body

**Simple Format (Recommended):** Just provide candidate names
```json
{
  "title": "Classical Dance Competition",
  "candidates": [
    "Alice Johnson",
    "Bob Smith",
    "Charlie Brown"
  ]
}
```

**Object Format:** Provide candidate objects (team will be auto-populated)
```json
{
  "title": "Modern Dance Competition",
  "candidates": [
    {
      "name": "Alice Johnson"
    },
    {
      "name": "Bob Smith"
    }
  ],
  "results": {
    "Alice Johnson": 8,
    "Bob Smith": 7
  }
}
```

#### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Program name/title |
| `candidates` | array | Yes | Array of candidate names (strings) or candidate objects |
| `candidates[]` | string\|object | Yes | Candidate name or object with `name` property |
| `results` | object | No | Optional initial results (candidate name → score mapping) |

#### Request Examples

```bash
curl -X POST /api/event/cultural_fest_2024/programs \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Classical Dance",
    "candidates": [
      "Alice Johnson",
      "Bob Smith",
      "Charlie Brown"
    ]
  }'
```

```javascript
// Using fetch - Simple string format
const response = await fetch('/api/event/cultural_fest_2024/programs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ID_TOKEN',
    'Content-Type': 'application/json',
    'credentials': 'include'
  },
  body: JSON.stringify({
    title: "Classical Dance Competition",
    candidates: [
      "Alice Johnson",
      "Bob Smith",
      "Charlie Brown"
    ]
  })
});

// Using axios - Object format with initial results
const response = await axios.post('/api/event/cultural_fest_2024/programs', {
  title: "Modern Dance Competition",
  candidates: [
    { name: "Alice Johnson" },
    { name: "Bob Smith" }
  ],
  results: {
    "Alice Johnson": 8,
    "Bob Smith": 7
  }
}, {
  headers: {
    'Authorization': 'Bearer YOUR_ID_TOKEN'
  }
});
```

#### Success Response (201 Created)

```json
{
  "message": "Program added successfully",
  "program": {
    "id": "auto_generated_id",
    "title": "Classical Dance Competition",
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
        "team": "Team Alpha",
        "id": "charlie_003"
      }
    ],
    "results": null,
    "createdAt": "2024-06-15T10:30:00.000Z"
  },
  "candidatesWithTeams": 3
}
```

#### Error Responses

**400 Bad Request - Missing Title**
```json
{
  "error": "Title is required"
}
```

**400 Bad Request - Invalid Candidates**
```json
{
  "error": "Candidates are required and must be an array"
}
```

**400 Bad Request - Invalid Candidate Format**
```json
{
  "error": "Candidate[0] must be a string name or object with 'name' property"
}
```

**400 Bad Request - Candidate Not Found**
```json
{
  "error": "Candidate 'John Doe' not found in event candidates"
}
```

**400 Bad Request - Invalid Results**
```json
{
  "error": "Results include invalid candidates: John Doe, Jane Smith"
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

**500 Internal Server Error**
```json
{
  "error": "Failed to add program"
}
```

## Auto-Team Population Feature

### How It Works

1. **Input**: You provide candidate names (as strings or objects with `name` property)
2. **Lookup**: The API queries the event's candidates database
3. **Population**: Each candidate's team information is automatically added
4. **Validation**: Ensures all candidates exist in the event
5. **Storage**: Program is saved with complete candidate + team information

### Before vs After

**Before (Manual Team Assignment):**
```json
{
  "title": "Dance Program",
  "candidates": [
    {
      "name": "Alice Johnson",
      "team": "Team Alpha"  // Had to provide manually
    }
  ]
}
```

**After (Automatic Team Population):**
```json
{
  "title": "Dance Program",
  "candidates": [
    "Alice Johnson"  // Just the name - team auto-populated!
  ]
}
```

**Stored Result:**
```json
{
  "title": "Dance Program",
  "candidates": [
    {
      "name": "Alice Johnson",
      "team": "Team Alpha",  // Automatically fetched
      "id": "alice_001"
    }
  ]
}
```

## Implementation Details

### Data Flow
1. **Candidate Lookup**: Fetches all candidates from `events/{eventId}/candidates/` collection
2. **Name Mapping**: Creates a map of candidate names to their complete data (name, team, id)
3. **Processing**: Converts input candidate names/objects to complete candidate objects
4. **Validation**: Ensures all referenced candidates exist in the database
5. **Storage**: Saves program with automatically populated team information

### Validation Rules
1. **Title**: Required, must be a non-empty string
2. **Candidates**: Required, must be a non-empty array
3. **Candidate Names**: Must exist in the event's candidates collection
4. **Results**: If provided, all candidate names must match selected candidates
5. **Authentication**: POST requests require valid admin authentication

### Input Flexibility
The API accepts candidates in multiple formats:
- **String Array**: `["Alice Johnson", "Bob Smith"]`
- **Object Array**: `[{"name": "Alice Johnson"}, {"name": "Bob Smith"}]`
- **Mixed Array**: `["Alice Johnson", {"name": "Bob Smith"}]`

## Frontend Integration Examples

### React Component

```javascript
import React, { useState, useEffect } from 'react';

function ProgramManager({ eventId }) {
  const [programs, setPrograms] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newProgram, setNewProgram] = useState({
    title: '',
    selectedCandidates: []
  });

  // Fetch programs and candidates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch programs
        const programsResponse = await fetch(`/api/event/${eventId}/programs`);
        if (programsResponse.ok) {
          const programsData = await programsResponse.json();
          setPrograms(programsData);
        }

        // Fetch available candidates
        const candidatesResponse = await fetch(`/api/event/${eventId}/candidates`);
        if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates');
        const candidatesData = await candidatesResponse.json();
        setCandidates(candidatesData.candidates);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // Add new program
  const addProgram = async (e) => {
    e.preventDefault();
    
    if (!newProgram.title.trim()) {
      setError('Program title is required');
      return;
    }

    if (newProgram.selectedCandidates.length === 0) {
      setError('At least one candidate must be selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Send just the candidate names - teams will be auto-populated
      const response = await fetch(`/api/event/${eventId}/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: newProgram.title,
          candidates: newProgram.selectedCandidates // Just names!
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add program');
      }
      
      const result = await response.json();
      
      // Refresh programs list
      const programsResponse = await fetch(`/api/event/${eventId}/programs`);
      if (programsResponse.ok) {
        const programsData = await programsResponse.json();
        setPrograms(programsData);
      }
      
      // Reset form
      setNewProgram({ title: '', selectedCandidates: [] });
      
      console.log('Program created with auto-populated teams:', result.program.candidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle candidate selection
  const handleCandidateSelection = (candidateName, isSelected) => {
    setNewProgram(prev => ({
      ...prev,
      selectedCandidates: isSelected 
        ? [...prev.selectedCandidates, candidateName]
        : prev.selectedCandidates.filter(name => name !== candidateName)
    }));
  };

  return (
    <div>
      <h2>Programs Management</h2>
      
      {error && <div className="error">Error: {error}</div>}
      
      {/* Add Program Form */}
      <form onSubmit={addProgram}>
        <div>
          <input
            type="text"
            placeholder="Program Title"
            value={newProgram.title}
            onChange={(e) => setNewProgram({...newProgram, title: e.target.value})}
            required
          />
        </div>
        
        {/* Candidate Selection */}
        <div>
          <h4>Select Candidates (Teams will be auto-populated):</h4>
          {candidates.map((candidate) => (
            <label key={candidate.id} style={{display: 'block'}}>
              <input
                type="checkbox"
                checked={newProgram.selectedCandidates.includes(candidate.name)}
                onChange={(e) => handleCandidateSelection(candidate.name, e.target.checked)}
              />
              {candidate.name} ({candidate.team})
            </label>
          ))}
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Program'}
        </button>
      </form>

      {/* Programs List */}
      <div>
        <h3>Existing Programs</h3>
        {loading && <div>Loading programs...</div>}
        
        {programs.map((program) => (
          <div key={program.id} style={{ 
            border: '1px solid #ddd', 
            padding: '10px', 
            margin: '10px 0',
            borderRadius: '5px'
          }}>
            <h4>{program.title}</h4>
            <p><strong>Status:</strong> {program.status || 'Active'}</p>
            
            <div>
              <strong>Participants:</strong>
              <ul>
                {program.candidates.map((candidate, index) => (
                  <li key={index}>
                    {candidate.name} - <em>{candidate.team}</em>
                  </li>
                ))}
              </ul>
            </div>
            
            {program.results && (
              <div>
                <strong>Results:</strong>
                <ul>
                  {program.results.map((result, index) => (
                    <li key={index}>
                      {result.name}: {result.position} ({result.score} points)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <small>Created: {new Date(program.createdAt).toLocaleDateString()}</small>
            {program.publishedAt && (
              <small> | Published: {new Date(program.publishedAt).toLocaleDateString()}</small>
            )}
          </div>
        ))}

        {programs.length === 0 && !loading && (
          <p>No programs created yet. Add some programs to get started!</p>
        )}
      </div>
    </div>
  );
}

export default ProgramManager;
```

### Vue.js Component

```vue
<template>
  <div>
    <h2>Programs Management</h2>
    
    <div v-if="error" class="error">Error: {{ error }}</div>
    
    <!-- Add Program Form -->
    <form @submit.prevent="addProgram">
      <div>
        <input
          v-model="newProgram.title"
          type="text"
          placeholder="Program Title"
          required
        />
      </div>
      
      <!-- Candidate Selection -->
      <div>
        <h4>Select Candidates (Teams auto-populated):</h4>
        <label v-for="candidate in candidates" :key="candidate.id" class="candidate-checkbox">
          <input
            type="checkbox"
            :checked="newProgram.selectedCandidates.includes(candidate.name)"
            @change="handleCandidateSelection(candidate.name, $event.target.checked)"
          />
          {{ candidate.name }} ({{ candidate.team }})
        </label>
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Adding...' : 'Add Program' }}
      </button>
    </form>

    <!-- Programs List -->
    <div>
      <h3>Existing Programs</h3>
      <div v-if="loading">Loading programs...</div>
      
      <div v-for="program in programs" :key="program.id" class="program-card">
        <h4>{{ program.title }}</h4>
        <p><strong>Status:</strong> {{ program.status || 'Active' }}</p>
        
        <div>
          <strong>Participants:</strong>
          <ul>
            <li v-for="candidate in program.candidates" :key="candidate.id">
              {{ candidate.name }} - <em>{{ candidate.team }}</em>
            </li>
          </ul>
        </div>
        
        <div v-if="program.results">
          <strong>Results:</strong>
          <ul>
            <li v-for="result in program.results" :key="result.name">
              {{ result.name }}: {{ result.position }} ({{ result.score }} points)
            </li>
          </ul>
        </div>
        
        <small>Created: {{ formatDate(program.createdAt) }}</small>
        <small v-if="program.publishedAt"> | Published: {{ formatDate(program.publishedAt) }}</small>
      </div>

      <p v-if="programs.length === 0 && !loading">
        No programs created yet. Add some programs to get started!
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['eventId'],
  data() {
    return {
      programs: [],
      candidates: [],
      loading: false,
      error: null,
      newProgram: {
        title: '',
        selectedCandidates: []
      }
    };
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        this.loading = true;
        
        // Fetch programs
        const programsResponse = await fetch(`/api/event/${this.eventId}/programs`);
        if (programsResponse.ok) {
          this.programs = await programsResponse.json();
        }

        // Fetch candidates
        const candidatesResponse = await fetch(`/api/event/${this.eventId}/candidates`);
        if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates');
        const candidatesData = await candidatesResponse.json();
        this.candidates = candidatesData.candidates;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async addProgram() {
      if (!this.newProgram.title.trim()) {
        this.error = 'Program title is required';
        return;
      }

      if (this.newProgram.selectedCandidates.length === 0) {
        this.error = 'At least one candidate must be selected';
        return;
      }

      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch(`/api/event/${this.eventId}/programs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: this.newProgram.title,
            candidates: this.newProgram.selectedCandidates
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add program');
        }
        
        await this.fetchData();
        this.newProgram = { title: '', selectedCandidates: [] };
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    handleCandidateSelection(candidateName, isSelected) {
      if (isSelected) {
        this.newProgram.selectedCandidates.push(candidateName);
      } else {
        this.newProgram.selectedCandidates = this.newProgram.selectedCandidates
          .filter(name => name !== candidateName);
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.program-card {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
}

.candidate-checkbox {
  display: block;
  margin: 5px 0;
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

## Simple Integration Example

For basic usage, you can now create programs with just candidate names:

```javascript
const createProgram = async (eventId, title, candidateNames) => {
  try {
    const response = await fetch(`/api/event/${eventId}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        candidates: candidateNames // Just names - teams auto-populated!
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create program');
    }

    const result = await response.json();
    console.log('Program created with auto-populated teams:');
    result.program.candidates.forEach(candidate => {
      console.log(`- ${candidate.name} (${candidate.team})`);
    });
    
    return result;
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

// Usage - Super simple!
createProgram('cultural_fest_2024', 'Dance Competition', [
  'Alice Johnson',
  'Bob Smith', 
  'Charlie Brown'
])
.then(result => {
  console.log('Success:', result.message);
  // Teams are automatically populated from candidates database
})
.catch(error => console.error('Failed:', error.message));
```

## Related Endpoints

- `GET /api/event/:id` - Get basic event information
- `GET /api/event/:id/candidates` - Get event candidates (required for programs)
- `POST /api/event/:id/candidates` - Add candidates to event (prerequisite)
- `GET /api/event/:id/teams` - Get event teams
- `POST /api/event/:id/teams` - Add teams to event
- `POST /api/event/:id/programs/:programId/results` - Add results to program
- `POST /api/event/:id/programs/:programId/publish` - Publish program results

## Best Practices

1. **Candidate Management**: Ensure candidates and teams are created before creating programs
2. **Name Consistency**: Use exact candidate names as stored in the candidates collection
3. **Error Handling**: Handle candidate not found errors gracefully
4. **UI Feedback**: Show which teams will be auto-populated for selected candidates
5. **Validation**: Validate candidate selection on frontend before submission
6. **Batch Selection**: Support selecting multiple candidates efficiently
7. **Team Display**: Display candidate teams in selection UI for user confirmation

## Workflow Integration

### Complete Event Setup
```javascript
// 1. Create teams
await createTeams(eventId, teamsData);

// 2. Add candidates with team assignments  
await addCandidates(eventId, candidatesData);

// 3. Create programs - teams auto-populated!
await createPrograms(eventId, programsData);

// 4. Add results and publish
await addProgramResults(eventId, programId, scores);
await publishProgram(eventId, programId);
```

### Data Consistency
The auto-population feature ensures:
- **Consistency**: Team assignments match the candidates database
- **Simplicity**: No need to manually specify teams when creating programs
- **Validation**: Automatic validation that candidates exist
- **Efficiency**: Reduced data entry and potential errors

## Migration Guide

### From Manual Team Assignment
**Old Way:**
```json
{
  "title": "Dance Program",
  "candidates": [
    {
      "name": "Alice Johnson",
      "team": "Team Alpha"
    }
  ]
}
```

**New Way:**
```json
{
  "title": "Dance Program", 
  "candidates": [
    "Alice Johnson"
  ]
}
```

### Backward Compatibility
The API still accepts the old format with explicit team assignments, but the team information will be overridden with data from the candidates database to ensure consistency.

## Changelog

### Version 2.0 (Current)
- **✨ NEW**: Automatic team population for candidates
- **✨ NEW**: Support for string array candidate input
- **✨ NEW**: Flexible candidate input formats
- **🔧 IMPROVED**: Enhanced validation with better error messages
- **🔧 IMPROVED**: Simplified program creation workflow

### Version 1.1
- Added program results management
- Support for program publishing
- Enhanced candidate validation

### Version 1.0
- Initial implementation with manual team assignment
- Basic program CRUD operations