# NFL Playoff Bracket - Quick Reference

## ✅ What's Built

### Core Features
- **Authentication System**: Email/password login and signup
- **Room Management**: Create rooms with unique codes, join existing rooms
- **Bracket Interface**: Select playoff teams for each matchup
- **Persistent Storage**: All brackets saved to Firebase Firestore
- **Game Results Tracking**: Shows correct/incorrect picks as games finish
- **Locked Brackets**: Once submitted, brackets cannot be changed

### Tech Stack
- React 18 + Vite
- Firebase (Auth + Firestore)
- Tailwind CSS (modern styling)
- React Router (navigation)
- Lucide React (icons)

## 🚀 Getting Started

1. **Setup Firebase** (see SETUP.md)
2. **Create .env file** with your Firebase credentials
3. **Run locally**: `npm run dev`
4. **Visit**: http://localhost:5173

## 📁 Project Structure

```
src/
├── components/
│   ├── Login.jsx          # Authentication UI
│   ├── RoomSelection.jsx  # Create/join rooms
│   └── Bracket.jsx        # Main bracket interface
├── services/
│   └── nflData.js         # NFL data fetching (mock + ESPN API ready)
├── AuthContext.jsx        # User authentication state
├── firebase.js            # Firebase configuration
└── App.jsx               # Main app with routing
```

## 🎯 User Flow

1. User lands → Login/Signup page
2. After auth → Room selection page
3. Create new room OR join with code
4. Enter bracket → Select teams for each matchup
5. Picks auto-save to Firestore
6. Bracket locks after first submission
7. Results update as games finish (green = correct, red = incorrect)

## 🔧 Next Steps to Enhance

### 1. Real NFL Data Integration
Currently using mock data. To integrate real data:

```javascript
// In src/services/nflData.js
export const fetchPlayoffTeams = async () => {
  const response = await axios.get(
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams'
  );
  // Parse and return playoff teams
};
```

### 2. Live Game Results
Update `fetchGameResults()` to pull from ESPN API:

```javascript
export const fetchGameResults = async () => {
  const response = await axios.get(
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
  );
  // Parse completed games and winners
};
```

### 3. Add More Rounds
Expand bracket to include:
- Wild Card Round (current)
- Divisional Round
- Conference Championships
- Super Bowl

### 4. Leaderboard
Add a leaderboard component showing:
- Users in the room
- Correct picks count
- Overall ranking

### 5. Real-time Updates
Use Firestore real-time listeners:

```javascript
import { onSnapshot } from 'firebase/firestore';

onSnapshot(doc(db, 'brackets', bracketId), (doc) => {
  // Update UI when bracket changes
});
```

## 🎨 Styling

The app uses Tailwind CSS with:
- Gradient backgrounds
- Modern card designs
- Responsive layouts
- Hover effects
- Color-coded feedback (green/red/blue)

## 🔒 Security

Update Firestore rules in Firebase Console (see SETUP.md) to:
- Restrict reads/writes to authenticated users
- Ensure users can only modify their own brackets
- Prevent bracket changes after submission

## 📱 Mobile Responsive

The app is fully responsive:
- Desktop: Side-by-side AFC/NFC
- Mobile: Stacked layout
- Touch-friendly buttons

## 🚢 Deployment

### GitHub Pages (Automatic)
1. Push to GitHub
2. Add Firebase secrets to repository
3. GitHub Actions auto-deploys on push to main

### Manual Deploy
```bash
npm run build
# Upload dist/ folder to any static host
```

## 🐛 Troubleshooting

**Firebase errors**: Check .env file has correct credentials
**Build errors**: Run `npm install` to ensure all dependencies installed
**Routing issues on deploy**: Ensure base path in vite.config.js matches your URL

## 📊 Database Schema

**rooms**: `{ code, createdAt }`
**userRooms**: `{ userId, roomId, roomCode }`
**brackets**: `{ userId, roomId, picks: { round_match: teamId }, submittedAt }`

## 🎮 Testing Locally

1. Create account (user1@test.com)
2. Create room → Copy room code
3. Open incognito window
4. Create account (user2@test.com)
5. Join room with code
6. Both users fill brackets
7. Test game results by updating mock data in nflData.js
