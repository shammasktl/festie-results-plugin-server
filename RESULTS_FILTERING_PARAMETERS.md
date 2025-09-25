# Results Filtering Parameters Guide

## Overview
The `/api/event/:id/results` endpoint supports three powerful query parameters for filtering and limiting results based on team performance and competition strategy.

## Parameters

| Parameter | Type | Purpose | Logic |
|-----------|------|---------|-------|
| `limit` | number | Limit number of programs returned | Returns first N programs |
| `raiseTeam` | string | Show results to help raise a team's ranking | Returns results from teams with **lower** scores |
| `lowerTeam` | string | Show results to help lower a team's ranking | Returns results from teams with **higher** scores |

---

## Visual Diagram

```
                    TEAM STANDINGS EXAMPLE
                    ┌─────────────────────────┐
                    │  Team Sigma    : 23 pts │  🥇 1st Place
                    │  Team Delta    : 15 pts │  🥈 2nd Place  
                    │  Team Gamma    : 12 pts │  🥉 3rd Place
                    │  Team Beta     : 8 pts  │  🏃 4th Place
                    └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            PARAMETER EFFECTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

📈 raiseTeam=Team Gamma (12 pts)
   ┌─────────────────────────────────────────────────┐
   │ GOAL: Help Team Gamma move UP in rankings       │
   │ LOGIC: Show results from teams with LOWER scores│
   │ RETURNS: Results from Team Beta (8 pts)         │
   │ REASON: Team Gamma can potentially overtake     │
   │         these lower-scoring teams               │
   └─────────────────────────────────────────────────┘
   
   Team Gamma (12) can beat ──┐
                              ▼
   ┌─────────────────────────────────────┐
   │ ❌ Team Sigma (23) - Not returned   │
   │ ❌ Team Delta (15) - Not returned   │
   │ ❌ Team Gamma (12) - Not returned   │
   │ ✅ Team Beta  (8)  - RETURNED       │
   └─────────────────────────────────────┘

📉 lowerTeam=Team Delta (15 pts)  
   ┌─────────────────────────────────────────────────┐
   │ GOAL: Keep Team Delta DOWN in rankings          │
   │ LOGIC: Show results from teams with HIGHER scores│
   │ RETURNS: Results from Team Sigma (23 pts)       │
   │ REASON: These teams will keep Delta in lower    │
   │         position by maintaining their lead      │
   └─────────────────────────────────────────────────┘
   
   Team Delta (15) will be beaten by ──┐
                                       ▼
   ┌─────────────────────────────────────┐
   │ ✅ Team Sigma (23) - RETURNED       │
   │ ❌ Team Delta (15) - Not returned   │
   │ ❌ Team Gamma (12) - Not returned   │
   │ ❌ Team Beta  (8)  - Not returned   │
   └─────────────────────────────────────┘

🔢 limit=2
   ┌─────────────────────────────────────────────────┐
   │ GOAL: Limit number of programs shown           │
   │ LOGIC: Return only first N program groups      │
   │ RETURNS: First 2 programs (regardless of teams)│
   │ REASON: Reduce data load, focus on key programs│
   └─────────────────────────────────────────────────┘
```

---

## Detailed Examples

### Example 1: Raising Team Performance

**Scenario**: You want to help "Team Gamma" improve their ranking

```bash
GET /api/event/alaska/results?raiseTeam=Team Gamma
```

**Current Standings:**
- Team Sigma: 23 points (1st)
- Team Delta: 15 points (2nd) 
- **Team Gamma: 12 points (3rd)** ← Target team
- Team Beta: 8 points (4th)

**API Returns:** Results from Team Beta (8 points)

**Strategic Logic:** 
- Team Gamma (12 pts) can potentially overtake Team Beta (8 pts)
- By focusing on programs where Beta competed, Gamma can identify opportunities to score better
- This helps strategize which programs Gamma should focus on to climb rankings

### Example 2: Maintaining Team Dominance  

**Scenario**: You want to ensure "Team Delta" stays in lower positions

```bash
GET /api/event/alaska/results?lowerTeam=Team Delta
```

**Current Standings:**
- **Team Sigma: 23 points (1st)** ← Teams that will keep Delta down
- Team Delta: 15 points (2nd) ← Target team
- Team Gamma: 12 points (3rd)
- Team Beta: 8 points (4th)

**API Returns:** Results from Team Sigma (23 points)

**Strategic Logic:**
- Team Sigma (23 pts) has higher scores than Team Delta (15 pts)
- By showing Sigma's results, you can see what programs are keeping Delta in 2nd place
- This helps understand the competitive landscape above Delta

### Example 3: Combined Filtering

**Scenario**: Show top 3 programs that could help Team Gamma rise

```bash
GET /api/event/alaska/results?raiseTeam=Team Gamma&limit=3
```

**Effect:**
1. Filter results to show only teams scoring lower than Team Gamma
2. Limit to first 3 programs from those filtered results
3. Focus on most relevant competitive opportunities

---

## Response Structure

```json
{
  "eventId": "alaska",
  "status": "not_published",
  "results": {
    "Program 1": [...],
    "Program 2": [...]
  },
  "filters": {
    "limit": 3,
    "raiseTeam": "Team Gamma", 
    "lowerTeam": null
  },
  "teamScores": {
    "Team Sigma": 23,
    "Team Delta": 15,
    "Team Gamma": 12,
    "Team Beta": 8
  },
  "totalResults": 8,
  "totalPrograms": 5,
  "returnedPrograms": 3
}
```

---

## Use Cases

### 🎯 **Competition Strategy**
- **Coaches**: Identify which teams your team can realistically overtake
- **Event Managers**: Balance competition by showing relevant matchups

### 📊 **Performance Analysis** 
- **raiseTeam**: "What programs should we focus on to improve our ranking?"
- **lowerTeam**: "Which teams are our main competition blocking our progress?"

### 🔍 **Data Management**
- **limit**: Reduce API payload size for mobile apps or quick overviews
- **Combined filters**: Get targeted, actionable insights

---

## Error Handling

### Invalid Team Name
```json
{
  "error": "Team 'NonExistent Team' not found"
}
```

### Invalid Limit
```json
// limit=0 or negative numbers are ignored
// limit=abc becomes null
```

---

## API Endpoint Summary

```
GET /api/event/:eventId/results?limit=N&raiseTeam=TEAM_NAME&lowerTeam=TEAM_NAME
```

**All parameters are optional and can be combined for powerful filtering capabilities.**