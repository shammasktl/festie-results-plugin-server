# GET /api/event/:id/published-results - Published Results API Documentation

## Overview
The `/api/event/:id/published-results` endpoint retrieves only the published results for a specific event. Unlike the regular results endpoint, this only returns results from programs that have been explicitly published, providing a clean view of finalized results for public consumption.

## Endpoint Details

**Method:** `GET`  
**URL:** `/api/event/:id/published-results`  
**Authentication:** Public (no authentication required)  
**Content-Type:** `application/json`

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

## Request Example

```bash
GET /api/event/summer_fest_2024/published-results
```

```javascript
// Using fetch
const response = await fetch('/api/event/summer_fest_2024/published-results');
const data = await response.json();

// Using axios
const response = await axios.get('/api/event/summer_fest_2024/published-results');
```

## Response Format

### Success Response (200 OK)

The response returns an object with published results grouped by program name:

```json
{
  "eventId": "summer_fest_2024",
  "status": "published",
  "results": {
    "Singing Competition": [
      {
        "position": 1,
        "participantId": "participant_123",
        "participantName": "Alice Johnson",
        "participantTeam": "Red Hawks",
        "grade": "A",
        "score": 8,
        "category": "vocal"
      },
      {
        "position": 2,
        "participantId": "participant_456",
        "participantName": "Bob Smith",
        "participantTeam": "Blue Eagles",
        "grade": "A", 
        "score": 7,
        "category": "vocal"
      }
    ],
    "Dance Performance": [
      {
        "position": 1,
        "participantId": "participant_789",
        "participantName": "Carol Davis",
        "participantTeam": "Green Lions",
        "grade": "B",
        "score": 6,
        "category": "classical"
      }
    ]
  },
  "extraAwards": [
    {
      "award": "Best Overall Performance",
      "participantId": "participant_123",
      "participantName": "Alice Johnson"
    }
  ],
  "publishedAt": "2024-06-15T14:30:00.000Z",
  "totalPrograms": 5,
  "publishedPrograms": 2
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | The ID of the event |
| `status` | string | Event status (will always be "published" for successful responses) |
| `results` | object | Published results grouped by program name |
| `extraAwards` | array | Array of special awards |
| `publishedAt` | string | ISO timestamp when event results were published |
| `totalPrograms` | number | Total number of programs in the event |
| `publishedPrograms` | number | Number of programs with published results |

### Results Object Structure

The `results` field contains only programs that have been published:
- **Keys**: Program names (only published programs appear)
- **Values**: Arrays of participant results for that program

Each result contains the same fields as the regular results endpoint:

| Field | Type | Description |
|-------|------|-------------|
| `position` | number | Participant's position (1, 2, or 3) |
| `participantId` | string | Unique identifier of the participant |
| `participantName` | string | Name of the participant |
| `participantTeam` | string | Team/group the participant belongs to |
| `grade` | string | Grade category: "A" or "B" |
| `score` | number | Points awarded (8, 7, 6, or 5) |
| `category` | string | Optional category classification |

## Error Responses

### 404 Not Found - Event Not Found
```json
{
  "error": "Event not found"
}
```

### 404 Not Found - No Published Results
```json
{
  "error": "No published results available for this event"
}
```

This error occurs when:
- The event exists but its status is not "published"
- No individual programs have been published yet

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

## Key Differences from Regular Results Endpoint

| Aspect | `/api/event/:id/results` | `/api/event/:id/published-results` |
|--------|--------------------------|-------------------------------------|
| **Access** | All results (draft + published) | Only published results |
| **Event Status** | Any status | Must be "published" |
| **Program Status** | All programs | Only published programs |
| **Use Case** | Admin/management view | Public/consumer view |
| **Additional Fields** | None | `publishedAt`, `totalPrograms`, `publishedPrograms` |

## Usage Scenarios

### 1. Public Results Display
Perfect for displaying official results to the public:

```javascript
const displayPublicResults = async (eventId) => {
  try {
    const response = await fetch(`/api/event/${eventId}/published-results`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('No published results available yet');
        return null;
      }
      throw new Error('Failed to fetch published results');
    }
    
    const data = await response.json();
    console.log('Published results:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};
```

### 2. Results Verification
Check if specific programs have been published:

```javascript
const checkPublishedPrograms = async (eventId) => {
  try {
    const data = await fetch(`/api/event/${eventId}/published-results`)
      .then(res => res.json());
    
    const publishedProgramNames = Object.keys(data.results);
    const publicationStats = {
      total: data.totalPrograms,
      published: data.publishedPrograms,
      pending: data.totalPrograms - data.publishedPrograms,
      programs: publishedProgramNames
    };
    
    return publicationStats;
  } catch (error) {
    console.error('Error checking publication status:', error);
    return null;
  }
};
```

### 3. Conditional Display
Show different content based on publication status:

```javascript
const getResultsForDisplay = async (eventId, isAdmin = false) => {
  try {
    if (isAdmin) {
      // Admins see all results
      return await fetch(`/api/event/${eventId}/results`).then(res => res.json());
    } else {
      // Public sees only published results
      return await fetch(`/api/event/${eventId}/published-results`).then(res => res.json());
    }
  } catch (error) {
    console.error('Error fetching results:', error);
    return null;
  }
};
```

## Frontend Integration Examples

### React Component

```javascript
import React, { useState, useEffect } from 'react';

function PublishedResults({ eventId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublishedResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${eventId}/published-results`);
        
        if (response.status === 404) {
          setError('No published results available yet');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch published results');
        }
        
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedResults();
  }, [eventId]);

  if (loading) return <div>Loading published results...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!results) return <div>No published results available</div>;

  return (
    <div className="published-results">
      <h1>Official Results</h1>
      
      <div className="publication-info">
        <p>Published on: {new Date(results.publishedAt).toLocaleDateString()}</p>
        <p>Programs published: {results.publishedPrograms} of {results.totalPrograms}</p>
      </div>
      
      {Object.entries(results.results).map(([programName, programResults]) => (
        <div key={programName} className="program-results">
          <h2>{programName}</h2>
          <div className="results-list">
            {programResults
              .sort((a, b) => a.position - b.position)
              .map((result, index) => (
                <div key={index} className="result-item">
                  <span className="position">{result.position}</span>
                  <span className="participant">{result.participantName}</span>
                  <span className="team">({result.participantTeam})</span>
                  <span className="grade">Grade {result.grade}</span>
                  <span className="score">Score: {result.score}</span>
                </div>
              ))}
          </div>
        </div>
      ))}

      {results.extraAwards?.length > 0 && (
        <div className="extra-awards">
          <h2>Special Awards</h2>
          <ul>
            {results.extraAwards.map((award, index) => (
              <li key={index}>
                <strong>{award.award}</strong>: {award.participantName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PublishedResults;
```

### Vue.js Component

```vue
<template>
  <div class="published-results">
    <h1>Official Results</h1>
    
    <div v-if="loading">Loading published results...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="!results">No published results available</div>
    
    <div v-else>
      <div class="publication-info">
        <p>Published on: {{ formatDate(results.publishedAt) }}</p>
        <p>Programs published: {{ results.publishedPrograms }} of {{ results.totalPrograms }}</p>
      </div>
      
      <div v-for="(programResults, programName) in results.results" :key="programName" class="program-results">
        <h2>{{ programName }}</h2>
        <div class="results-list">
          <div 
            v-for="(result, index) in sortedResults(programResults)" 
            :key="index" 
            class="result-item"
          >
            <span class="position">{{ result.position }}</span>
            <span class="participant">{{ result.participantName }}</span>
            <span class="team">({{ result.participantTeam }})</span>
            <span class="grade">Grade {{ result.grade }}</span>
            <span class="score">Score: {{ result.score }}</span>
          </div>
        </div>
      </div>

      <div v-if="results.extraAwards?.length" class="extra-awards">
        <h2>Special Awards</h2>
        <ul>
          <li v-for="(award, index) in results.extraAwards" :key="index">
            <strong>{{ award.award }}</strong>: {{ award.participantName }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['eventId'],
  data() {
    return {
      results: null,
      loading: true,
      error: null
    };
  },
  async mounted() {
    await this.fetchPublishedResults();
  },
  methods: {
    async fetchPublishedResults() {
      try {
        this.loading = true;
        const response = await fetch(`/api/event/${this.eventId}/published-results`);
        
        if (response.status === 404) {
          this.error = 'No published results available yet';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch published results');
        }
        
        this.results = await response.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },
    sortedResults(programResults) {
      return [...programResults].sort((a, b) => a.position - b.position);
    }
  }
};
</script>

<style scoped>
.published-results {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.publication-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.program-results {
  margin-bottom: 30px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.position {
  font-weight: bold;
  font-size: 1.2em;
  min-width: 30px;
}

.participant {
  font-weight: 600;
}

.team {
  color: #666;
}

.grade, .score {
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.9em;
}

.extra-awards {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #dee2e6;
}

.error {
  color: red;
  text-align: center;
  padding: 20px;
}
</style>
```

## API Comparison Example

```javascript
// Compare all results vs published results
const compareResults = async (eventId) => {
  try {
    const [allResults, publishedResults] = await Promise.allSettled([
      fetch(`/api/event/${eventId}/results`).then(res => res.json()),
      fetch(`/api/event/${eventId}/published-results`).then(res => res.json())
    ]);

    console.log('All results programs:', Object.keys(allResults.value?.results || {}));
    console.log('Published results programs:', Object.keys(publishedResults.value?.results || {}));
    
    const unpublishedPrograms = Object.keys(allResults.value?.results || {})
      .filter(program => !Object.keys(publishedResults.value?.results || {}).includes(program));
    
    console.log('Unpublished programs:', unpublishedPrograms);
    
    return {
      total: allResults.value,
      published: publishedResults.value,
      unpublishedPrograms
    };
  } catch (error) {
    console.error('Error comparing results:', error);
  }
};
```

## Best Practices

1. **Use for Public Display**: Use this endpoint for public-facing results displays
2. **Error Handling**: Always handle 404 errors gracefully (no published results yet)
3. **Fallback Strategy**: Consider fallback to regular results endpoint for admin users
4. **Caching**: Results can be cached since they represent finalized data
5. **Publication Status**: Show publication statistics to inform users
6. **Real-time Updates**: Consider implementing real-time updates when new results are published

## Related Endpoints

- `GET /api/event/:id/results` - Get all results (draft + published)
- `POST /api/event/:eventId/programs/:programId/publish` - Publish program results
- `POST /api/event/:id/publish-results` - Publish all event results
- `PATCH /api/event/:eventId/programs/:programId/scores` - Enter program scores

## Security Considerations

- **Public Access**: No authentication required - safe for public consumption
- **Data Filtering**: Only published data is exposed
- **No Sensitive Information**: Results are meant to be public once published

## Changelog

### Version 1.0 (Current)
- Initial implementation of published results endpoint
- Program-level publication filtering
- Additional metadata fields (publishedAt, program counts)
- Public access with proper error handling