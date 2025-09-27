# Team Points System - Score-Based Implementation

## Overview
The team points system has been **completely simplified** to use scores (1-11) directly as team points. This creates a transparent and fair ranking system where every participant's score directly contributes to their team's ranking.

## Scoring System

### Score = Team Points
| Score | Grade | Position | **Team Points** |
|-------|--------|----------|-----------------|
| **11** | A | 1st | **+11** |
| **10** | A | 2nd | **+10** |
| **9** | A | 3rd | **+9** |
| **8** | A | None | **+8** |
| **7** | B | 1st | **+7** |
| **6** | B | 2nd | **+6** |
| **5** | B | 3rd | **+5** |
| **4** | B | None | **+4** |
| **3** | None | 1st | **+3** |
| **2** | None | 2nd | **+2** |
| **1** | None | 3rd | **+1** |

## Key Benefits

✅ **Simple calculation**: Score directly = Team points  
✅ **All results count**: Every participant matters  
✅ **Transparent ranking**: Easy to understand and verify  
✅ **Fair system**: No arbitrary multipliers or complex formulas  
✅ **Real-time updates**: Automatic recalculation on changes  

## Team Ranking Example

### Team Alpha
- Alice: Score 11 → +11 points
- Bob: Score 8 → +8 points  
- Charlie: Score 6 → +6 points
- **Total: 25 points**

### Team Beta  
- Diana: Score 10 → +10 points
- Eve: Score 7 → +7 points
- Frank: Score 4 → +4 points
- **Total: 21 points**

### Team Gamma
- Grace: Score 9 → +9 points
- Henry: Score 5 → +5 points
- Ivy: Score 2 → +2 points
- **Total: 16 points**

**Final Ranking:**
1. **Team Alpha** - 25 points
2. **Team Beta** - 21 points  
3. **Team Gamma** - 16 points

## Implementation Details

### Dual Scoring System
- **Internal scores (1-11)**: Used for compatibility and individual scoring
- **Team points**: Same as internal scores, used for team ranking

### Automatic Recalculation
Team points are automatically recalculated when:
- Results are added via `PATCH /api/event/:eventId/programs/:programId/scores`
- Results are published via `POST /api/event/:eventId/programs/:programId/publish`  
- Published results are viewed via `GET /api/event/:id/published-results`

### All Results Count
Unlike previous systems, **ALL results** are now saved and contribute to team points:
- Results with positions (11, 10, 9, 7, 6, 5, 3, 2, 1)
- Results without positions (8, 4)
- Every participant's contribution matters

## API Integration

### Team Response Format
```json
{
  "teams": [
    {
      "id": "team_alpha",
      "name": "Team Alpha",
      "totalScore": 87,           // Internal 1-11 scores sum
      "totalTeamPoints": 87,      // Team ranking points (same as totalScore)
      "gradePoints": 64,          // Points from grades (A=8, B=4)
      "positionPoints": 23,       // Points from positions (1st=6, 2nd=4, 3rd=2)
      "resultsCount": 12,
      "pointsBreakdown": {
        "grades": { "A": 8, "B": 4 },
        "positions": { "1st": 2, "2nd": 3, "3rd": 1 }
      }
    }
  ]
}
```

Note: `totalTeamPoints` is now the primary ranking metric and equals the sum of all scores.

## Strategic Results Integration

The strategic results system also uses the simplified scoring:
- Current team scores calculated from published program scores
- Projected scores use the same score-based calculation
- Strategic program selection optimized for maximum score impact

This creates a consistent scoring experience across all system components.
