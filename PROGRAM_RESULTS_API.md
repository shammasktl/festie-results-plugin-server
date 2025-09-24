# Program Results API - Score-Based Input

## Overview

The program results system uses a simplified score-based input method that automatically determines positions and grades based on fixed score values.

### Endpoints
```
PATCH /api/event/:eventId/programs/:programId/scores - Enter/update program results
POST /api/event/:eventId/programs/:programId/publish - Publish program results
GET /api/event/:id/published-results - Get published results only
```

### Score-to-Position-Grade Mapping
- **8** = 1st Place with A grade
- **7** = 1st Place with B grade (or 2nd Place with A grade if multiple 7s)
- **6** = 2nd Place with B grade (or 3rd Place with A grade if multiple 6s)
- **5** = 3rd Place with B grade

### Features
- ✅ **Fixed score values** - only accepts 8, 7, 6, 5
- ✅ **Automatic position and grade calculation** - no manual input needed
- ✅ **Team information preserved** - teams are maintained from program candidates
- ✅ **Intelligent duplicate handling** - multiple same scores assigned different positions
- ✅ **Main results integration** - results are saved to `/api/event/:id/results`
- ✅ **Grouped results** - event results are grouped by program name

### Request Format

```json
{
  "scores": {
    "Rinshad": 8,
    "Thakiyudheen": 7,
    "Richu": 6,
    "Amal Mafaz": 5
  }
}
```

### Response Format

```json
{
  "message": "Program results updated successfully with score-based input",
  "resultsWithPositions": [
    {
      "name": "Rinshad",
      "team": "Team Delta",
      "score": 8,
      "position": "1st Place",
      "grade": "A"
    },
    {
      "name": "Thakiyudheen", 
      "team": "Team Sigma",
      "score": 7,
      "position": "1st Place",
      "grade": "B"
    },
    {
      "name": "Richu",
      "team": "Team Gamma", 
      "score": 6,
      "position": "2nd Place",
      "grade": "B"
    },
    {
      "name": "Amal Mafaz",
      "team": "Team Beta",
      "score": 5,
      "position": "3rd Place",
      "grade": "B"
    }
  ],
  "mainEventResultsAdded": 4
}
```

### Program Storage Format (Enhanced)

After submitting scores, the program document will store:

```json
{
  "id": "s8Wq3ABzldjsdlePqKdq",
  "title": "Singing Competition",
  "candidates": [
    {
      "name": "Rinshad",
      "team": "Team Delta"
    },
    {
      "name": "Thakiyudheen",
      "team": "Team Sigma"
    }
  ],
  "results": [
    {
      "name": "Rinshad",
      "team": "Team Delta",
      "score": 8,
      "position": "1st Place",
      "grade": "A"
    },
    {
      "name": "Thakiyudheen",
      "team": "Team Sigma", 
      "score": 7,
      "position": "1st Place",
      "grade": "B"
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Main Event Results Integration

Results are automatically saved to the main event results collection, accessible via:
```
GET /api/event/:id/results
```

**New Format (Grouped by Program):**
```json
{
  "eventId": "alaska",
  "status": "not_published",
  "results": {
    "Tech Tangle": [
      {
        "position": 1,
        "participantName": "Rinshad",
        "participantTeam": "Team Delta",
        "grade": "A",
        "score": 8,
        "category": null
      },
      {
        "position": 1,
        "participantName": "Thakiyudheen",
        "participantTeam": "Team Sigma",
        "grade": "B",
        "score": 7,
        "category": null
      }
    ]
  },
  "extraAwards": []
}
```

## Usage Examples

### 1. Basic Score Submission

```bash
curl -X PATCH http://localhost:5000/api/event/alaska/programs/YSq3YtEZ1P7TAOXhShnY/scores \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_token_here" \
  -d '{
    "scores": {
      "Rinshad": 8,
      "Thakiyudheen": 7,
      "Richu": 6,
      "Amal Mafaz": 5
    }
  }'
```

### 2. Publishing Program Results

```bash
curl -X POST http://localhost:5000/api/event/alaska/programs/YSq3YtEZ1P7TAOXhShnY/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_token_here"
```

**Response:**
```json
{
  "success": true,
  "message": "Program results published successfully",
  "programTitle": "Tech Tangle",
  "resultsCount": 4
}
```

### 3. Getting Published Results Only

```bash
curl -X GET http://localhost:5000/api/event/alaska/published-results
```

**Response:**
```json
{
  "eventId": "alaska",
  "status": "published",
  "results": {
    "Tech Tangle": [
      {
        "position": 1,
        "participantName": "Rinshad",
        "participantTeam": "Team Delta",
        "grade": "A",
        "score": 8,
        "category": null
      },
      {
        "position": 1,
        "participantName": "Thakiyudheen",
        "participantTeam": "Team Sigma",
        "grade": "B",
        "score": 7,
        "category": null
      }
    ]
  },
  "extraAwards": [],
  "publishedAt": "2024-06-15T14:30:00.000Z",
  "totalPrograms": 5,
  "publishedPrograms": 1
}
```

### 4. Multiple Participants with Same Score

```bash
curl -X PATCH http://localhost:5000/api/event/alaska/programs/YSq3YtEZ1P7TAOXhShnY/scores \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_token_here" \
  -d '{
    "scores": {
      "Alice": 7,
      "Bob": 7,
      "Charlie": 6
    }
  }'
```
*Note: First person with score 7 gets 1st Place B grade, second gets 2nd Place A grade*

### 5. Complete Workflow - Enter, Publish and View Results

```javascript
const enterAndPublishResults = async (eventId, programId, scores) => {
  try {
    // Step 1: Enter the scores
    const scoresResponse = await fetch(`/api/event/${eventId}/programs/${programId}/scores`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ scores })
    });

    if (!scoresResponse.ok) {
      throw new Error('Failed to enter scores');
    }

    const scoresResult = await scoresResponse.json();
    console.log('Scores entered:', scoresResult);

    // Step 2: Publish the results
    const publishResponse = await fetch(`/api/event/${eventId}/programs/${programId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!publishResponse.ok) {
      throw new Error('Failed to publish results');
    }

    const publishResult = await publishResponse.json();
    console.log('Results published:', publishResult);

    // Step 3: View published results
    const resultsResponse = await fetch(`/api/event/${eventId}/published-results`);
    
    if (!resultsResponse.ok) {
      throw new Error('Failed to fetch published results');
    }

    const publishedResults = await resultsResponse.json();
    console.log('Published results:', publishedResults);

    return { scoresResult, publishResult, publishedResults };
  } catch (error) {
    console.error('Error in workflow:', error);
    throw error;
  }
};

// Example usage
const scores = {
  "Rinshad": 8,
  "Thakiyudheen": 7,
  "Richu": 6,
  "Amal Mafaz": 5
};

enterAndPublishResults("alaska", "YSq3YtEZ1P7TAOXhShnY", scores)
  .then(results => console.log('Complete workflow success:', results))
  .catch(error => console.error('Workflow failed:', error));
```

### 5. Frontend Helper Functions

```javascript
const updateProgramScores = async (eventId, programId, scores) => {
  const response = await fetch(`/api/event/${eventId}/programs/${programId}/scores`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // For cookie-based auth
    body: JSON.stringify({
      scores
    })
  });
  
  return response.json();
};

const publishProgramResults = async (eventId, programId) => {
  const response = await fetch(`/api/event/${eventId}/programs/${programId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });
  
  return response.json();
};

const getPublishedResults = async (eventId) => {
  const response = await fetch(`/api/event/${eventId}/published-results`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No published results available yet');
    }
    throw new Error('Failed to fetch published results');
  }
  
  return response.json();
};

// Example usage
const scores = {
  "Rinshad": 8,
  "Thakiyudheen": 7,
  "Richu": 6,
  "Amal Mafaz": 5
};

// Enter scores first
updateProgramScores("alaska", "YSq3YtEZ1P7TAOXhShnY", scores)
  .then(data => {
    console.log('Scores entered:', data);
    // Then publish results
    return publishProgramResults("alaska", "YSq3YtEZ1P7TAOXhShnY");
  })
  .then(publishData => {
    console.log('Results published:', publishData);
    // Finally get published results
    return getPublishedResults("alaska");
  })
  .then(publishedResults => console.log('Published results:', publishedResults))
  .catch(error => console.error('Error:', error));
```

### 5. With Frontend (Fetch API)

## Score-to-Grade Mapping

| Score | Position & Grade | Description |
|-------|------------------|-------------|
| 8     | 1st Place, A grade | Highest achievement |
| 7     | 1st Place, B grade* | High achievement |
| 6     | 2nd Place, B grade* | Good achievement |
| 5     | 3rd Place, B grade | Basic achievement |

*When multiple participants have the same score (7 or 6), positions are assigned intelligently*

## Error Handling

### Score Entry Errors

#### Invalid Candidates
```json
{
  "error": "Scores include invalid candidates: NonExistentCandidate"
}
```

#### Invalid Scores
```json
{
  "error": "Scores must be one of: 8, 7, 6, 5. Invalid scores for: Alice, Bob"
}
```

#### Missing Scores
```json
{
  "error": "Scores are required"
}
```

### Publish Errors

#### Program Not Found
```json
{
  "error": "Program not found"
}
```

#### No Results to Publish
```json
{
  "error": "Program has no results to publish. Please enter results first using the scores endpoint."
}
```

#### Authentication Required
```json
{
  "error": "No token provided"
}
```

## Key Features

1. **Simplified Input**: Only need to provide scores (8, 7, 6, 5) - positions and grades are automatic
2. **Intelligent Positioning**: Handles duplicate scores by assigning different positions intelligently
3. **Team Preservation**: Team information is automatically maintained from program candidates
4. **Dual Storage**: Results saved to both program subcollection and main event results
5. **Grouped Results**: Event results API returns data grouped by program name for better organization
6. **Validation**: Strict validation ensures only valid scores and existing candidates are accepted
7. **Publishing Control**: Two-step process - enter results first, then publish when ready
8. **Status Tracking**: Programs track their publication status and timestamp
9. **Published Results API**: Separate endpoint to view only published results for public consumption
10. **Publication Metadata**: Published results include publication timestamps and program statistics

## API Workflow

The program results system follows a three-step workflow:

### 1. Enter Results (Admin only)
```
PATCH /api/event/:eventId/programs/:programId/scores
```
- Input scores for participants (8, 7, 6, 5)
- Automatic position and grade calculation
- Results saved to both program and main event storage
- Status: Draft (not yet published)

### 2. Publish Results (Admin only)
```
POST /api/event/:eventId/programs/:programId/publish
```
- Publish the entered results
- Set program status to "published"
- Add publication timestamp
- Results become visible to public

### 3. View Published Results (Public)
```
GET /api/event/:id/published-results
```
- Access only published results
- No authentication required
- Includes publication metadata
- Perfect for public displays

### Comparison with Regular Results
```
GET /api/event/:id/results (All results - admin view)
GET /api/event/:id/published-results (Published only - public view)
```

## Migration from Previous Version

- **No position-based endpoint**: The `/results` endpoint has been removed
- **Fixed score values**: No longer accepts arbitrary numbers - only 8, 7, 6, 5
- **No grade parameter**: Grade is automatically determined from score value
- **Enhanced responses**: Results now include both position and grade information