# Festie Results Plugin - Score-Based Team Ranking System

A comprehensive event management API with **score-based team points calculation** for fair and transparent competition ranking.

## 🚀 Key Features

### Score-Based Team Points
- **Simple calculation**: Score (1-11) directly equals team points
- **All results count**: Every participant contributes to team ranking
- **Real-time updates**: Automatic team points recalculation
- **Fair ranking**: Transparent and easy to understand

### New Scoring Guide (1-11)
| Score | Grade | Position | Team Points |
|-------|--------|----------|-------------|
| 11 | A | 1st | +11 |
| 10 | A | 2nd | +10 |
| 9 | A | 3rd | +9 |
| 8 | A | None | +8 |
| 7 | B | 1st | +7 |
| 6 | B | 2nd | +6 |
| 5 | B | 3rd | +5 |
| 4 | B | None | +4 |
| 3 | None | 1st | +3 |
| 2 | None | 2nd | +2 |
| 1 | None | 3rd | +1 |

### API Highlights
- **Automatic team points recalculation** when results are added or published
- **Strategic results system** for team ranking optimization
- **Published results tracking** with public access
- **Session-based authentication** with HTTP-only cookies
- **Auto-generated event IDs** for uniqueness

## 🎯 Quick Start

1. **Start the server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5000`

2. **Add results with automatic team points:**
   ```bash
   curl -X PATCH /api/event/EVENT_ID/programs/PROGRAM_ID/scores \
     -H "Content-Type: application/json" \
     -d '{
       "scores": {
         "Alice": 11,  # +11 team points
         "Bob": 8,     # +8 team points
         "Carol": 4    # +4 team points  
       }
     }'
   ```

3. **Publish results (triggers team points recalculation):**
   ```bash
   curl -X POST /api/event/EVENT_ID/programs/PROGRAM_ID/publish
   ```

## 📊 Team Ranking Example

**Team Alpha:**
- Alice: 11 points + Bob: 8 points = **19 points**

**Team Beta:** 
- Carol: 7 points + Dave: 4 points = **11 points**

**Ranking:** Team Alpha (19) > Team Beta (11)

By shifting from complex grade+position calculations to a simple score-based system, this extension provides transparent, fair team competition with real-time ranking updates. Perfect for arts fests, hackathons, and any competitive event requiring team-based scoring!
