# GET /api/event/:id/results - Event Results API Documentation

## Overview
The `/api/event/:id/results` endpoint retrieves all results for a specific event. Results are automatically grouped by program name for better organization and easier consumption by frontend applications.

## Endpoint Details

**Method:** `GET`  
**URL:** `/api/event/:id/results`  
**Authentication:** Public (no authentication required)  
**Content-Type:** `application/json`

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

## Request Example

```bash
GET /api/event/summer_fest_2024/results
```

```javascript
// Using fetch
const response = await fetch('/api/event/summer_fest_2024/results');
const data = await response.json();

// Using axios
const response = await axios.get('/api/event/summer_fest_2024/results');
```

## Response Format

### Success Response (200 OK)

The response returns an object with the following structure:

```json
{
  "eventId": "string",
  "status": "string",
  "results": {
    "Program Name 1": [
      {
        "position": 1,
        "participantId": "string",
        "participantName": "string", 
        "participantTeam": "string",
        "grade": "string",
        "score": 8,
        "category": "string"
      }
    ],
    "Program Name 2": [...]
  },
  "extraAwards": [
    {
      "award": "string",
      "participantId": "string", 
      "participantName": "string"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | The ID of the event |
| `status` | string | Event status: `"not_published"` or `"published"` |
| `results` | object | Results grouped by program name (see below) |
| `extraAwards` | array | Array of special awards (optional) |

### Results Object Structure

The `results` field is an object where:
- **Keys**: Program names (e.g., "Singing Competition", "Dance Performance")
- **Values**: Arrays of participant results for that program

Each result in the array contains:

| Field | Type | Description |
|-------|------|-------------|
| `position` | number | Participant's position (1, 2, or 3) |
| `participantId` | string | Unique identifier of the participant |
| `participantName` | string | Name of the participant |
| `participantTeam` | string | Team/group the participant belongs to |
| `grade` | string | Grade category: "A" or "B" |
| `score` | number | Points awarded (8, 7, 6, or 5) |
| `category` | string | Optional category classification |

### Score System

The scoring system follows a fixed mapping:

| Grade | Position | Score |
|-------|----------|-------|
| A | 1st Place | 8 |
| A | 2nd Place | 7 |
| A | 3rd Place | 6 |
| B | 1st Place | 6 |
| B | 2nd Place | 5 |
| B | 3rd Place | 4 |
| A | 

## Example Response

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
    ],
    "Instrumental Music": [
      {
        "position": 1,
        "participantId": "participant_101",
        "participantName": "David Wilson",
        "participantTeam": "Yellow Falcons",
        "grade": "A",
        "score": 8,
        "category": "piano"
      },
      {
        "position": 3,
        "participantId": "participant_102",
        "participantName": "Eva Brown",
        "participantTeam": "Purple Panthers",
        "grade": "B",
        "score": 4,
        "category": "violin"
      }
    ]
  },
  "extraAwards": [
    {
      "award": "Best Overall Performance",
      "participantId": "participant_123",
      "participantName": "Alice Johnson"
    },
    {
      "award": "Most Creative Act",
      "participantId": "participant_789", 
      "participantName": "Carol Davis"
    }
  ]
}
```

## Error Responses

### 404 Not Found
Returned when the specified event ID does not exist.

```json
{
  "error": "Event not found"
}
```

### 500 Internal Server Error
Returned when there's a server-side error processing the request.

```json
{
  "error": "Internal server error"
}
```

## Implementation Notes

### Data Grouping
- Results are automatically grouped by `programName` for better organization
- The original `programName` field is removed from individual result objects since it becomes the grouping key
- This reduces payload size and makes frontend consumption easier

### Empty Results
- If an event has no results, the `results` object will be empty: `{}`
- The `extraAwards` array will be empty: `[]`

### Status Field
- `"not_published"`: Results are saved but not yet published
- `"published"`: Results are finalized and published

## Frontend Integration Examples

### React Example
```javascript
import React, { useState, useEffect } from 'react';

function EventResults({ eventId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/event/${eventId}/results`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [eventId]);

  if (loading) return <div>Loading results...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Event Results</h1>
      <p>Status: {results.status}</p>
      
      {Object.entries(results.results).map(([programName, programResults]) => (
        <div key={programName}>
          <h2>{programName}</h2>
          <ul>
            {programResults.map((result, index) => (
              <li key={index}>
                {result.position}. {result.participantName} 
                ({result.participantTeam}) - 
                Grade {result.grade}, Score: {result.score}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {results.extraAwards?.length > 0 && (
        <div>
          <h2>Special Awards</h2>
          <ul>
            {results.extraAwards.map((award, index) => (
              <li key={index}>
                {award.award}: {award.participantName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Vue.js Example
```javascript
<template>
  <div>
    <h1>Event Results</h1>
    <div v-if="loading">Loading results...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <p>Status: {{ results.status }}</p>
      
      <div v-for="(programResults, programName) in results.results" :key="programName">
        <h2>{{ programName }}</h2>
        <ul>
          <li v-for="(result, index) in programResults" :key="index">
            {{ result.position }}. {{ result.participantName }} 
            ({{ result.participantTeam }}) - 
            Grade {{ result.grade }}, Score: {{ result.score }}
          </li>
        </ul>
      </div>

      <div v-if="results.extraAwards?.length">
        <h2>Special Awards</h2>
        <ul>
          <li v-for="(award, index) in results.extraAwards" :key="index">
            {{ award.award }}: {{ award.participantName }}
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
    try {
      const response = await fetch(`/api/event/${this.eventId}/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      this.results = await response.json();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>
```

## Team Scoring Integration

### GET /api/event/:id/teams - Teams with Calculated Scores

The teams endpoint now includes automatic score calculation based on published results:

```javascript
const response = await fetch('/api/event/alaska/teams');
const data = await response.json();
```

**Response with Team Scores:**

```json
{
  "eventId": "alaska",
  "teams": [
    {
      "id": "team1",
      "name": "Team Sigma",
      "description": "Sigma Does Better...",
      "totalScore": 23,
      "resultsCount": 3,
      "programResults": [
        {
          "programName": "Tech Tangle",
          "position": 1,
          "grade": "A",
          "score": 8
        },
        {
          "programName": "Dance Battle",
          "position": 2,
          "grade": "A",
          "score": 7
        }
      ]
    }
  ],
  "totalPublishedPrograms": 5,
  "totalResults": 15
}
```

### New Team Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalScore` | number | Sum of all scores from published program results |
| `resultsCount` | number | Number of published results for this team |
| `programResults` | array | Detailed breakdown of each published result |
| `totalPublishedPrograms` | number | Total programs published in the event |
| `totalResults` | number | Total published results across all teams |

### Team Scoring Rules

1. **Only published results count** toward team scores
2. Teams are **automatically sorted** by total score (highest first)
3. Teams with no published results show `totalScore: 0`
4. Individual program results include program name, position, grade, and score

### Team Score Calculation Example

```
Team Sigma Results:
- Tech Tangle: 1st Place, Grade A = 8 points
- Dance Battle: 2nd Place, Grade A = 7 points  
- Singing Contest: 1st Place, Grade B = 6 points
Total Score: 8 + 7 + 6 = 21 points
```

## Related Endpoints

- `POST /api/event/:id/results` - Save/update event results (requires authentication)
- `POST /api/event/:id/publish-results` - Publish event results (requires authentication)
- `PATCH /api/event/:eventId/programs/:programId/scores` - Update individual program results (requires authentication)
- `GET /api/event/:id` - Get basic event information
- `GET /api/event/:id/programs` - Get all programs for an event

## Changelog

### Version 1.2 (Current)
- Added team scoring integration with `/api/event/:id/teams` endpoint
- Teams now show calculated `totalScore` based on published results only
- Added `programResults` breakdown for detailed team performance analysis
- Teams automatically sorted by total score (highest first)

### Version 1.1
- Added grouped results format by program name
- Removed redundant `programName` field from individual results
- Enhanced response structure for better frontend consumption

### Version 1.0
- Initial implementation with flat results array
- Basic result structure with positions and scores