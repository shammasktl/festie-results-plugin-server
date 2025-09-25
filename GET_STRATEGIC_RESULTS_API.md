# GET /api/event/:id/strategic-results - Strategic Program Results API Documentation

## Overview
The `/api/event/:id/strategic-results` endpoint provides strategic program selection to help manipulate team rankings. It analyzes unpublished programs with results and selects specific ones that would have the maximum impact on a target team's position in the leaderboard.

**🔥 Key Feature:** Returns complete program data (not individual candidate scores) including all participants, results, and program metadata.

## Endpoint Details

**Method:** `GET`  
**URL:** `/api/event/:id/strategic-results`  
**Authentication:** Public (no authentication required)  
**Content-Type:** `application/json`

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the event |

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `raiseTeam` | string | Conditional | Team name to help rise in rankings |
| `lowerTeam` | string | Conditional | Team name to help lower in rankings |
| `limit` | number | No | Number of results to return (default: 5) |

### Parameter Rules:
- **Either `raiseTeam` OR `lowerTeam` is required** (cannot use both together)
- Team names must match exactly with teams from `/api/event/:id/teams`
- `limit` must be a positive integer

## Strategic Logic

### 🔺 Raise Team Strategy (`raiseTeam`)

**Goal:** Help the specified team move UP in rankings

**Logic:**
1. Filters to **unpublished programs only** (programs with results but not published)
2. Finds programs where the `raiseTeam` **has good results/scores**
3. Calculates total points the target team would gain from each program
4. Sorts by team score descending (programs where target team performs best first)
5. Returns top N programs that would boost the team's ranking if published

**Example:** `raiseTeam=Team Gamma` returns programs where Team Gamma has the best results

### 🔻 Lower Team Strategy (`lowerTeam`)

**Goal:** Help the specified team move DOWN in rankings

**Logic:**
1. Filters to **unpublished programs only** (programs with results but not published)
2. Finds programs where **OTHER teams have good results** (not the `lowerTeam`)
3. Calculates total points other teams would gain from each program
4. Sorts by other teams' scores descending (programs where competitors perform best first)
5. Returns top N programs that would push the target team down if published

**Example:** `lowerTeam=Team Delta` returns programs where other teams have strong results that would surpass Team Delta

## Request Examples

### Help Team Rise in Rankings

```bash
GET /api/event/alaska/strategic-results?raiseTeam=Team Gamma&limit=3
```

```javascript
// Using fetch
const response = await fetch('/api/event/alaska/strategic-results?raiseTeam=Team Gamma&limit=3');
const data = await response.json();

// Using axios
const response = await axios.get('/api/event/alaska/strategic-results', {
  params: { raiseTeam: 'Team Gamma', limit: 3 }
});
```

### Help Team Lower in Rankings

```bash
GET /api/event/alaska/strategic-results?lowerTeam=Team Delta&limit=5
```

```javascript
const response = await fetch('/api/event/alaska/strategic-results?lowerTeam=Team Delta&limit=5');
const data = await response.json();
```

### Help Team Lower in Rankings

```bash
GET /api/event/alaska/strategic-results?lowerTeam=Team Delta&limit=5
```

```javascript
const response = await fetch('/api/event/alaska/strategic-results?lowerTeam=Team Delta&limit=5');
const data = await response.json();
```

## Response Format

### Success Response (200 OK)

```json
{
  "eventId": "alaska",
  "strategy": "raise-Team Gamma",
  "targetTeam": "Team Gamma",
  "programs": {
    "Classical Dance": {
      "programId": "prog_001",
      "title": "Classical Dance",
      "candidates": [
        {
          "name": "Alice Johnson",
          "team": "Team Gamma",
          "id": "alice_001"
        },
        {
          "name": "Bob Smith",
          "team": "Team Beta",
          "id": "bob_002"
        }
      ],
      "results": [
        {
          "name": "Alice Johnson",
          "team": "Team Gamma",
          "score": 8,
          "position": "1st Place",
          "grade": "A"
        },
        {
          "name": "Bob Smith",
          "team": "Team Beta",
          "score": 6,
          "position": "2nd Place", 
          "grade": "B"
        }
      ],
      "status": "active",
      "createdAt": "2024-06-15T10:30:00.000Z"
    },
    "Modern Dance": {
      "programId": "prog_002",
      "title": "Modern Dance",
      "candidates": [
        {
          "name": "Charlie Brown",
          "team": "Team Gamma",
          "id": "charlie_003"
        }
      ],
      "results": [
        {
          "name": "Charlie Brown",
          "team": "Team Gamma",
          "score": 7,
          "position": "1st Place",
          "grade": "B"
        }
      ],
      "status": "active",
      "createdAt": "2024-06-15T11:00:00.000Z"
    }
  },
  "selectedPrograms": 2,
  "requestedLimit": 3,
  "totalUnpublishedPrograms": 5,
  "currentRankings": [
    { "rank": 1, "team": "Team Sigma", "score": 23 },
    { "rank": 2, "team": "Team Delta", "score": 15 },
    { "rank": 3, "team": "Team Gamma", "score": 12 },
    { "rank": 4, "team": "Team Beta", "score": 8 }
  ],
  "projectedRankings": [
    { "rank": 1, "team": "Team Gamma", "score": 27, "currentScore": 12 },
    { "rank": 2, "team": "Team Sigma", "score": 23, "currentScore": 23 },
    { "rank": 3, "team": "Team Delta", "score": 15, "currentScore": 15 },
    { "rank": 4, "team": "Team Beta", "score": 14, "currentScore": 8 }
  ],
  "impact": {
    "targetTeamCurrentRank": 3,
    "targetTeamProjectedRank": 1,
    "rankChange": {
      "current": 3,
      "projected": 1,
      "change": 2,
      "direction": "improved"
    },
    "pointsGained": 15
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | The ID of the event |
| `strategy` | string | Strategy used: `"raise-[TeamName]"` or `"lower-[TeamName]"` |
| `targetTeam` | string | The team being targeted for ranking manipulation |
| `programs` | object | Selected programs with complete data (candidates, results, metadata) |
| `programs[].programId` | string | Unique program identifier |
| `programs[].title` | string | Program name |
| `programs[].candidates` | array | Complete list of program participants with teams |
| `programs[].results` | array | Complete program results with scores and positions |
| `programs[].status` | string | Program status ("active", "completed", etc.) |
| `programs[].createdAt` | string | Program creation timestamp |
| `selectedPrograms` | number | Actual number of programs returned |
| `requestedLimit` | number | The limit parameter that was requested |
| `totalUnpublishedPrograms` | number | Total unpublished programs available |
| `currentRankings` | array | Current team standings based on published results |
| `projectedRankings` | array | Projected standings if selected programs were published |
| `impact` | object | Analysis of the ranking impact |

### Impact Analysis Fields

| Field | Type | Description |
|-------|------|-------------|
| `targetTeamCurrentRank` | number | Current rank of the target team |
| `targetTeamProjectedRank` | number | Projected rank if programs are published |
| `rankChange.current` | number | Current ranking position |
| `rankChange.projected` | number | Projected ranking position |
| `rankChange.change` | number | Rank positions moved (positive = improved) |
| `rankChange.direction` | string | `"improved"`, `"declined"`, or `"unchanged"` |
| `pointsGained` | number | Total points the target team would gain |

## Error Responses

### Missing Required Parameters (400 Bad Request)

```json
{
  "error": "Either raiseTeam or lowerTeam parameter is required"
}
```

### Using Both Parameters (400 Bad Request)

```json
{
  "error": "Cannot use both raiseTeam and lowerTeam parameters together"
}
```

### Team Not Found (400 Bad Request)

```json
{
  "error": "Team 'Invalid Team Name' not found"
}
```

### Event Not Found (404 Not Found)

```json
{
  "error": "Event not found"
}
```

## Use Cases

### 🎯 Competition Management
- **Event Organizers**: Strategically publish program results to maintain competitive balance
- **Fair Play**: Ensure no single team dominates too early in the competition
- **Excitement**: Keep competition close and engaging throughout the event

### 📊 Strategic Planning
- **Program Analysis**: See which unpublished programs would benefit your team most
- **Competitive Intelligence**: Understand which programs competitors need published to stay ahead
- **Timing Strategy**: Decide when to publish which programs for maximum impact
- **Complete Context**: Get full program data including participants and all results

### 🏆 Tournament Flow
- **Phase Management**: Control how rankings evolve throughout the event by publishing strategic programs
- **Bracket Seeding**: Influence seeding for knockout phases
- **Audience Engagement**: Maintain suspense and viewer interest
- **Program-Level Control**: Manage entire competitions rather than individual results

## Frontend Integration Examples

### React Component Example

```jsx
import React, { useState } from 'react';

const StrategicProgramsAnalyzer = ({ eventId }) => {
  const [strategy, setStrategy] = useState({ type: '', team: '', limit: 5 });
  const [results, setResults] = useState(null);
  
  const analyzeStrategy = async () => {
    const params = new URLSearchParams({
      [strategy.type]: strategy.team,
      limit: strategy.limit
    });
    
    const response = await fetch(`/api/event/${eventId}/strategic-results?${params}`);
    const data = await response.json();
    setResults(data);
  };

  const publishProgram = async (programId, programTitle) => {
    try {
      const response = await fetch(`/api/event/${eventId}/programs/${programId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert(`Published program: ${programTitle}`);
        // Refresh strategy analysis
        analyzeStrategy();
      }
    } catch (error) {
      console.error('Failed to publish program:', error);
    }
  };

  return (
    <div className="strategic-analyzer">
      <h3>Strategic Programs Analyzer</h3>
      
      <div className="strategy-selector">
        <select onChange={(e) => setStrategy({...strategy, type: e.target.value})}>
          <option value="">Select Strategy</option>
          <option value="raiseTeam">Raise Team</option>
          <option value="lowerTeam">Lower Team</option>
        </select>
        
        <input 
          type="text"
          placeholder="Team Name"
          onChange={(e) => setStrategy({...strategy, team: e.target.value})}
        />
        
        <input 
          type="number"
          min="1"
          max="20"
          value={strategy.limit}
          onChange={(e) => setStrategy({...strategy, limit: e.target.value})}
        />
        
        <button onClick={analyzeStrategy}>Analyze Strategy</button>
      </div>

      {results && (
        <div className="strategy-results">
          <h4>Impact Analysis</h4>
          <p>
            <strong>{results.targetTeam}</strong> would move from rank {results.impact.targetTeamCurrentRank} 
            to rank {results.impact.targetTeamProjectedRank} 
            ({results.impact.rankChange.direction}) gaining {results.impact.pointsGained} points
          </p>
          
          <div className="strategic-programs">
            <h5>Strategic Programs to Publish ({results.selectedPrograms})</h5>
            {Object.entries(results.programs).map(([programTitle, program]) => (
              <div key={program.programId} className="program-card">
                <div className="program-header">
                  <h6>{program.title}</h6>
                  <button onClick={() => publishProgram(program.programId, program.title)}>
                    Publish Program
                  </button>
                </div>
                
                <div className="program-details">
                  <strong>Participants:</strong>
                  <ul>
                    {program.candidates.map((candidate, idx) => (
                      <li key={idx}>{candidate.name} ({candidate.team})</li>
                    ))}
                  </ul>
                  
                  <strong>Results:</strong>
                  <ul>
                    {program.results.map((result, idx) => (
                      <li key={idx} className={result.team === results.targetTeam ? 'target-team-result' : ''}>
                        {result.name} ({result.team}) - {result.position}, Score: {result.score}
                      </li>
                    ))}
                  </ul>
                  
                  <small>Status: {program.status}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="rankings-comparison">
            <div className="current-rankings">
              <h5>Current Rankings</h5>
              <ol>
                {results.currentRankings.map((team) => (
                  <li key={team.team} className={team.team === results.targetTeam ? 'target-team' : ''}>
                    {team.team} - {team.score} pts
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="projected-rankings">
              <h5>Projected Rankings (After Publishing)</h5>
              <ol>
                {results.projectedRankings.map((team) => (
                  <li key={team.team} className={team.team === results.targetTeam ? 'target-team' : ''}>
                    {team.team} - {team.score} pts
                    {team.score !== team.currentScore && (
                      <span className="points-gained"> (+{team.score - team.currentScore})</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategicProgramsAnalyzer;
```

### Vue.js Component Example

```vue
<template>
  <div class="strategic-analyzer">
    <h3>Strategic Programs Analyzer</h3>
    
    <div class="controls">
      <select v-model="strategy.type">
        <option value="">Select Strategy</option>
        <option value="raiseTeam">Raise Team</option>
        <option value="lowerTeam">Lower Team</option>
      </select>
      
      <input v-model="strategy.team" placeholder="Team Name" />
      <input v-model.number="strategy.limit" type="number" min="1" max="20" />
      
      <button @click="analyzeStrategy" :disabled="!strategy.type || !strategy.team">
        Analyze Strategy
      </button>
    </div>

    <div v-if="results" class="results">
      <h4>{{ results.strategy }} Strategy Results</h4>
      
      <div class="impact-summary">
        <p>
          <strong>{{ results.targetTeam }}</strong> impact:
          Rank {{ results.impact.targetTeamCurrentRank }} → 
          {{ results.impact.targetTeamProjectedRank }}
          ({{ results.impact.rankChange.direction }})
          gaining {{ results.impact.pointsGained }} points
        </p>
      </div>

      <div class="strategic-programs">
        <h5>Programs to Publish ({{ results.selectedPrograms }})</h5>
        <div v-for="[title, program] in Object.entries(results.programs)" 
             :key="program.programId" class="program-card">
          <div class="program-header">
            <h6>{{ program.title }}</h6>
            <button @click="publishProgram(program.programId, program.title)">
              Publish Program
            </button>
          </div>
          
          <div class="program-content">
            <div class="participants">
              <strong>Participants:</strong>
              <ul>
                <li v-for="candidate in program.candidates" :key="candidate.id">
                  {{ candidate.name }} ({{ candidate.team }})
                </li>
              </ul>
            </div>
            
            <div class="program-results">
              <strong>Results:</strong>
              <ul>
                <li v-for="result in program.results" :key="result.name"
                    :class="{ 'target-team-result': result.team === results.targetTeam }">
                  {{ result.name }} ({{ result.team }}) - 
                  {{ result.position }}, Score: {{ result.score }}
                </li>
              </ul>
            </div>
            
            <div class="program-meta">
              <small>
                Status: {{ program.status }} | 
                Created: {{ formatDate(program.createdAt) }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <div class="rankings-comparison">
        <div class="current-rankings">
          <h5>Current Rankings</h5>
          <ol>
            <li v-for="team in results.currentRankings" :key="team.team"
                :class="{ 'target-team': team.team === results.targetTeam }">
              {{ team.team }} - {{ team.score }} pts
            </li>
          </ol>
        </div>
        
        <div class="projected-rankings">
          <h5>Projected Rankings</h5>
          <ol>
            <li v-for="team in results.projectedRankings" :key="team.team"
                :class="{ 'target-team': team.team === results.targetTeam }">
              {{ team.team }} - {{ team.score }} pts
              <span v-if="team.score !== team.currentScore" class="points-gained">
                (+{{ team.score - team.currentScore }})
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['eventId'],
  data() {
    return {
      strategy: { type: '', team: '', limit: 5 },
      results: null,
      loading: false
    };
  },
  methods: {
    async analyzeStrategy() {
      this.loading = true;
      try {
        const params = new URLSearchParams({
          [this.strategy.type]: this.strategy.team,
          limit: this.strategy.limit
        });
        
        const response = await fetch(`/api/event/${this.eventId}/strategic-results?${params}`);
        const data = await response.json();
        
        if (response.ok) {
          this.results = data;
        } else {
          alert(data.error);
        }
      } catch (error) {
        alert('Error analyzing strategy: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    async publishProgram(programId, programTitle) {
      try {
        const response = await fetch(`/api/event/${this.eventId}/programs/${programId}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          alert(`Published program: ${programTitle}`);
          this.analyzeStrategy(); // Refresh analysis
        } else {
          const error = await response.json();
          alert(`Failed to publish: ${error.error}`);
        }
      } catch (error) {
        alert('Error publishing program: ' + error.message);
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.target-team {
  background-color: #e8f5e8;
  font-weight: bold;
}

.target-team-result {
  background-color: #fff3cd;
  font-weight: bold;
}

.program-card {
  border: 1px solid #ddd;
  padding: 15px;
  margin: 10px 0;
  border-radius: 5px;
  background: #f9f9f9;
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rankings-comparison {
  display: flex;
  gap: 2rem;
  margin-top: 20px;
}

.current-rankings, .projected-rankings {
  flex: 1;
}

.points-gained {
  color: #28a745;
  font-weight: bold;
}
</style>
```

## Related Endpoints

- `GET /api/event/:id/teams` - Get teams with current scores
- `GET /api/event/:id/results` - Get all entered results  
- `GET /api/event/:id/published-results` - Get only published results
- `POST /api/event/:eventId/programs/:programId/publish` - Publish specific program results

## Best Practices

### 1. **Validate Teams First**
```javascript
// Get available teams before using strategic endpoint
const teamsResponse = await fetch('/api/event/alaska/teams');
const teamsData = await teamsResponse.json();
const availableTeams = teamsData.teams.map(team => team.name);
```

### 2. **Handle Empty Results**
```javascript
if (data.selectedResults === 0) {
  console.log('No unpublished results found for this strategy');
}
```

### 3. **Monitor Impact**
```javascript
const significantImpact = Math.abs(data.impact.rankChange.change) >= 2;
if (significantImpact) {
  console.log('This strategy would have significant ranking impact!');
}
```

### 4. **Combine with Publish Workflow**
```javascript
// 1. Analyze strategy
const strategy = await fetch('/api/event/alaska/strategic-results?raiseTeam=TeamA&limit=3');
const strategyData = await strategy.json();

// 2. Publish selected programs
for (const [programTitle, program] of Object.entries(strategyData.programs)) {
  const publishResponse = await fetch(`/api/event/alaska/programs/${program.programId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  console.log(`Published program: ${programTitle}`);
}
```

### 5. **Program-Level Validation**
```javascript
// Validate programs have results before analysis
if (data.selectedPrograms === 0) {
  console.log('No unpublished programs with results found for this strategy');
} else {
  console.log(`Found ${data.selectedPrograms} strategic programs to publish`);
  
  // Check each program's readiness
  Object.entries(data.programs).forEach(([title, program]) => {
    if (!program.results || program.results.length === 0) {
      console.warn(`Program ${title} has no results!`);
    } else {
      console.log(`Program ${title} has ${program.results.length} results ready to publish`);
    }
  });
}
```

## Changelog

### Version 2.0 (Current)
- **🔄 BREAKING CHANGE**: Now returns complete program data instead of individual candidate results
- **✨ NEW**: Returns full program objects with candidates, results, and metadata
- **✨ NEW**: `programs` field containing complete program information
- **✨ NEW**: `selectedPrograms` and `totalUnpublishedPrograms` fields
- **✨ NEW**: `pointsGained` in impact analysis
- **🔧 IMPROVED**: Strategy logic now works at program level for more comprehensive analysis
- **🔧 IMPROVED**: Better integration with program publishing workflow
- **📚 UPDATED**: Documentation with program-focused examples and use cases

### Version 1.0 
- Initial implementation with individual result selection
- Support for raise/lower team strategies
- Real-time ranking impact analysis
- Unpublished results filtering