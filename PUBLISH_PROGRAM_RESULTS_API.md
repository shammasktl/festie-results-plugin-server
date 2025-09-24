# POST /api/event/:eventId/programs/:programId/publish - Publish Program Results API

## Overview
The publish program results endpoint allows administrators to publish results for a specific program after scores have been entered via the scores endpoint. This creates a two-step workflow: enter results first, then publish when ready.

## Endpoint Details

**Method:** `POST`  
**URL:** `/api/event/:eventId/programs/:programId/publish`  
**Authentication:** Required (Admin only)  
**Content-Type:** `application/json`

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | string | Yes | Unique identifier of the event |
| `programId` | string | Yes | Unique identifier of the program |

## Headers

```
Authorization: Bearer YOUR_ID_TOKEN
```

Or use cookie-based authentication (recommended for browsers):
```
Cookie: token=your_token_here
```

## Request Body

No request body is required. This is a simple POST request to publish existing results.

## Request Examples

### Using cURL
```bash
curl -X POST http://localhost:5000/api/event/alaska/programs/YSq3YtEZ1P7TAOXhShnY/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_token_here"
```

### Using JavaScript Fetch
```javascript
const publishProgramResults = async (eventId, programId) => {
  try {
    const response = await fetch(`/api/event/${eventId}/programs/${programId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // For cookie-based auth
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to publish results');
    }

    return await response.json();
  } catch (error) {
    console.error('Error publishing results:', error);
    throw error;
  }
};

// Usage
publishProgramResults("alaska", "YSq3YtEZ1P7TAOXhShnY")
  .then(result => console.log('Published:', result))
  .catch(error => console.error('Failed:', error));
```

### Using Axios
```javascript
const publishResults = async (eventId, programId) => {
  try {
    const response = await axios.post(
      `/api/event/${eventId}/programs/${programId}/publish`,
      {}, // Empty body
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Program results published successfully",
  "programTitle": "Tech Tangle",
  "resultsCount": 4
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `message` | string | Success message |
| `programTitle` | string | Name/title of the published program |
| `resultsCount` | number | Number of results that were published |

## Error Responses

### 400 Bad Request - No Results to Publish

Occurs when trying to publish a program that has no results entered.

```json
{
  "error": "Program has no results to publish. Please enter results first using the scores endpoint."
}
```

**Resolution:** Use the PATCH `/api/event/:eventId/programs/:programId/scores` endpoint to enter results first.

### 401 Unauthorized - No Authentication

```json
{
  "error": "No token provided"
}
```

**Resolution:** Provide a valid authentication token in the Authorization header or ensure cookies are included.

### 403 Forbidden - Invalid Token

```json
{
  "error": "Invalid or expired token"
}
```

**Resolution:** Refresh your authentication token or log in again.

### 404 Not Found - Event Not Found

```json
{
  "error": "Event not found"
}
```

**Resolution:** Verify the eventId parameter is correct and the event exists.

### 404 Not Found - Program Not Found

```json
{
  "error": "Program not found"
}
```

**Resolution:** Verify the programId parameter is correct and the program exists within the specified event.

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

**Resolution:** Check server logs for detailed error information. This typically indicates a database or server configuration issue.

## What Publishing Does

When a program's results are published:

1. **Status Update**: The program document is updated with:
   - `status: "published"`
   - `publishedAt: "2024-06-15T14:30:00.000Z"`
   - `updatedAt: "2024-06-15T14:30:00.000Z"`

2. **Results Become Public**: Published results are typically displayed differently in frontend applications

3. **Audit Trail**: The publication timestamp provides an audit trail of when results were finalized

## Complete Workflow Example

Here's a complete workflow showing how to enter and publish results:

```javascript
const completeWorkflow = async (eventId, programId, scores) => {
  try {
    console.log('Step 1: Entering scores...');
    
    // Enter the scores
    const scoresResponse = await fetch(`/api/event/${eventId}/programs/${programId}/scores`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ scores })
    });

    if (!scoresResponse.ok) {
      const error = await scoresResponse.json();
      throw new Error(`Failed to enter scores: ${error.error}`);
    }

    const scoresResult = await scoresResponse.json();
    console.log('Scores entered successfully:', scoresResult);

    console.log('Step 2: Publishing results...');

    // Publish the results
    const publishResponse = await fetch(`/api/event/${eventId}/programs/${programId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(`Failed to publish results: ${error.error}`);
    }

    const publishResult = await publishResponse.json();
    console.log('Results published successfully:', publishResult);

    return {
      scoresEntered: scoresResult,
      resultsPublished: publishResult
    };

  } catch (error) {
    console.error('Workflow failed:', error.message);
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

completeWorkflow("alaska", "YSq3YtEZ1P7TAOXhShnY", scores)
  .then(result => {
    console.log('Complete workflow successful!');
    console.log('Results count:', result.resultsPublished.resultsCount);
    console.log('Program title:', result.resultsPublished.programTitle);
  })
  .catch(error => {
    console.error('Workflow failed:', error.message);
  });
```

## Frontend Integration Examples

### React Component with State Management

```javascript
import React, { useState } from 'react';

function ProgramResultsManager({ eventId, programId, programTitle }) {
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState(null);

  const enterScores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/event/${eventId}/programs/${programId}/scores`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scores })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      console.log('Scores entered:', result);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const publishResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/event/${eventId}/programs/${programId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      setPublished(true);
      console.log('Results published:', result);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>{programTitle}</h2>
      
      {error && (
        <div className="error" style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}
      
      {/* Score Entry Form */}
      <div>
        <h3>Enter Scores</h3>
        {/* Add form inputs for scores here */}
        <button onClick={enterScores} disabled={loading}>
          {loading ? 'Entering...' : 'Enter Scores'}
        </button>
      </div>

      {/* Publish Button */}
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={publishResults} 
          disabled={loading || published}
          style={{ 
            backgroundColor: published ? 'green' : '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          {loading ? 'Publishing...' : published ? 'Published ✓' : 'Publish Results'}
        </button>
      </div>

      {published && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          Results have been published successfully!
        </div>
      )}
    </div>
  );
}
```

### Vue.js Component

```vue
<template>
  <div>
    <h2>{{ programTitle }}</h2>
    
    <div v-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <!-- Score Entry Section -->
    <div>
      <h3>Enter Scores</h3>
      <!-- Add form for score entry -->
      <button @click="enterScores" :disabled="loading">
        {{ loading ? 'Entering...' : 'Enter Scores' }}
      </button>
    </div>

    <!-- Publish Section -->
    <div class="publish-section">
      <button 
        @click="publishResults" 
        :disabled="loading || published"
        :class="{ published: published }"
      >
        {{ loading ? 'Publishing...' : published ? 'Published ✓' : 'Publish Results' }}
      </button>
    </div>

    <div v-if="published" class="success">
      Results have been published successfully!
    </div>
  </div>
</template>

<script>
export default {
  props: ['eventId', 'programId', 'programTitle'],
  data() {
    return {
      scores: {},
      loading: false,
      published: false,
      error: null
    };
  },
  methods: {
    async enterScores() {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch(`/api/event/${this.eventId}/programs/${this.programId}/scores`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ scores: this.scores })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        const result = await response.json();
        console.log('Scores entered:', result);
        
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async publishResults() {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await fetch(`/api/event/${this.eventId}/programs/${this.programId}/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        const result = await response.json();
        this.published = true;
        console.log('Results published:', result);
        
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
.error {
  color: red;
  margin-bottom: 10px;
}

.success {
  color: green;
  margin-top: 10px;
}

.publish-section {
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.published {
  background-color: green;
}
</style>
```

## Best Practices

1. **Two-Step Process**: Always enter scores first, then publish when ready
2. **Error Handling**: Handle all possible error scenarios gracefully
3. **User Feedback**: Provide clear feedback about the publication status
4. **Validation**: Validate that results exist before attempting to publish
5. **Loading States**: Show loading indicators during API calls
6. **Authentication**: Ensure valid authentication tokens are provided
7. **Confirmation**: Consider adding a confirmation dialog before publishing

## Related Endpoints

- `PATCH /api/event/:eventId/programs/:programId/scores` - Enter program scores (prerequisite)
- `GET /api/event/:id/results` - View published results (includes published program results)
- `GET /api/event/:id/programs` - List all programs in an event
- `POST /api/event/:id/publish-results` - Publish all event results

## Security Considerations

- **Admin Only**: Only authenticated administrators can publish results
- **Token Validation**: All requests are validated for proper authentication
- **Event Ownership**: Ensure users can only publish results for events they manage
- **Rate Limiting**: Consider implementing rate limiting to prevent abuse

## Changelog

### Version 1.0 (Current)
- Initial implementation of program results publishing
- Two-step workflow: enter scores then publish
- Status tracking with timestamps
- Comprehensive error handling
- Admin authentication required