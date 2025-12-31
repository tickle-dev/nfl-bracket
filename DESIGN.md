# NFL Playoff Bracket - Detailed Design Document

## Project Overview
A React-based web application for creating and managing NFL playoff brackets with friends. Users can create/join rooms, fill out brackets, and track their predictions against actual game results.

## Tech Stack
- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS 4.x with @tailwindcss/postcss
- **Routing**: React Router v7
- **Backend**: Firebase (Authentication + Firestore)
- **Icons**: Lucide React
- **HTTP Client**: Axios (for future NFL API integration)
- **Deployment**: GitHub Pages (static hosting)

## Architecture

### Application Flow
```
User → Login/Signup → Room Selection → Bracket Interface → Results Tracking
```

### Component Hierarchy
```
App (BrowserRouter + AuthProvider)
├── Login (public route)
├── RoomSelection (private route)
│   ├── Create Room
│   ├── Join Room
│   └── My Rooms List
└── Bracket (private route)
    ├── Team Selection (AFC/NFC)
    ├── Pick Tracking
    └── Result Validation
```

## File Structure

```
/
├── src/
│   ├── components/
│   │   ├── Login.jsx              # Auth UI (login/signup toggle)
│   │   ├── RoomSelection.jsx      # Room management interface
│   │   └── Bracket.jsx            # Main bracket interface
│   ├── services/
│   │   └── nflData.js             # NFL data fetching (mock + ESPN API ready)
│   ├── App.jsx                    # Main app with routing
│   ├── AuthContext.jsx            # Authentication state management
│   ├── firebase.js                # Firebase initialization
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Tailwind directives
├── .github/workflows/
│   └── deploy.yml                 # GitHub Actions deployment
├── .env.example                   # Environment template
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Data Models

### Firestore Collections

#### `rooms`
```javascript
{
  code: string,           // 6-char uppercase unique code (e.g., "ABC123")
  createdAt: timestamp
}
```

#### `userRooms`
```javascript
{
  userId: string,         // Firebase Auth UID
  roomId: string,         // Reference to rooms collection
  roomCode: string        // Denormalized for quick access
}
```

#### `brackets`
Document ID: `{roomId}_{userId}` (composite key)
```javascript
{
  userId: string,
  roomId: string,
  picks: {
    "wildcard_0": 1,      // Key: round_matchIndex, Value: teamId
    "wildcard_1": 2,
    // ... more picks
  },
  submittedAt: timestamp
}
```

### Team Data Structure
```javascript
{
  id: number,             // Unique team identifier
  name: string,           // Full team name
  seed: number,           // Playoff seed (1-7)
  conference: string,     // "AFC" or "NFC"
  logo: string            // Emoji or URL (future)
}
```

### Game Results Structure
```javascript
{
  "wildcard_0": 1,        // Key: matchKey, Value: winnerId (null if not finished)
  "wildcard_1": 2,
  // ... more results
}
```

## Component Details

### 1. Login.jsx
**Purpose**: Handle user authentication

**State**:
- `isLogin`: boolean (toggle between login/signup)
- `email`: string
- `password`: string
- `error`: string

**Key Functions**:
- `handleSubmit()`: Calls AuthContext.login() or signup()

**Styling**: Green gradient background, centered white card

### 2. RoomSelection.jsx
**Purpose**: Create/join rooms and display user's rooms

**State**:
- `roomCode`: string (for joining)
- `userRooms`: array (user's joined rooms)

**Key Functions**:
- `createRoom()`: Generates 6-char code, creates room doc, adds to userRooms, navigates to bracket
- `joinRoom()`: Queries rooms by code, adds to userRooms, navigates to bracket
- `loadUserRooms()`: Fetches all rooms where userId matches current user

**Firestore Queries**:
```javascript
// Load user rooms
query(collection(db, 'userRooms'), where('userId', '==', user.uid))

// Find room by code
query(collection(db, 'rooms'), where('code', '==', roomCode.toUpperCase()))
```

**Styling**: Blue/purple gradient, grid layout with cards

### 3. Bracket.jsx
**Purpose**: Display teams, handle picks, show results

**State**:
- `teams`: array (playoff teams)
- `bracket`: object (user's saved bracket)
- `gameResults`: object (completed game winners)
- `loading`: boolean

**Key Functions**:
- `loadData()`: Fetches teams and game results in parallel
- `loadBracket()`: Gets user's bracket from Firestore
- `saveBracket()`: Saves picks to Firestore (auto-save on selection)
- `handleTeamSelect()`: Updates picks (disabled if bracket locked)
- `getMatchResult()`: Compares user pick with actual winner

**Bracket Locking Logic**:
```javascript
const isLocked = bracket?.picks && Object.keys(bracket.picks).length > 0;
```

**Result Indicators**:
- Green border + CheckCircle: Correct pick
- Red border + XCircle: Incorrect pick
- Blue border + CheckCircle: Selected but game not finished
- Gray border: Not selected

**Styling**: Dark gradient, side-by-side AFC/NFC cards

### 4. AuthContext.jsx
**Purpose**: Global authentication state

**Provides**:
- `user`: Firebase user object or null
- `loading`: boolean (auth state loading)
- `login(email, password)`: Promise
- `signup(email, password)`: Promise
- `logout()`: Promise

**Error Handling**: Shows configuration error screen if Firebase not initialized

### 5. App.jsx
**Purpose**: Main routing and auth protection

**Routes**:
- `/login`: Public (Login component)
- `/rooms`: Private (RoomSelection component)
- `/bracket/:roomId`: Private (Bracket component)
- `/`: Redirect to /rooms

**PrivateRoute Logic**:
```javascript
if (loading) return <LoadingScreen />;
return user ? children : <Navigate to="/login" />;
```

## Services

### nflData.js
**Purpose**: Fetch NFL playoff data and game results

**Functions**:

1. `fetchPlayoffTeams()`: Returns array of playoff teams
   - Currently: Mock data (14 teams)
   - Future: ESPN API integration

2. `fetchGameResults()`: Returns object of completed games
   - Currently: Mock data
   - Future: ESPN scoreboard API

3. `scrapeESPNData()`: Template for ESPN API calls
   - Endpoint: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

## Authentication Flow

```
1. User visits site
2. AuthContext checks Firebase auth state
3. If no user → redirect to /login
4. User enters email/password
5. Firebase Auth creates/validates user
6. AuthContext updates user state
7. App redirects to /rooms
8. User can now access protected routes
```

## Room Flow

```
CREATE ROOM:
1. User clicks "Create Room"
2. Generate random 6-char code
3. Create room doc in Firestore
4. Create userRooms doc linking user to room
5. Navigate to /bracket/:roomId

JOIN ROOM:
1. User enters room code
2. Query Firestore for room with that code
3. If found, create userRooms doc
4. Navigate to /bracket/:roomId
```

## Bracket Flow

```
FIRST TIME:
1. Load teams from nflData service
2. Check if bracket exists for this user+room
3. If not, show empty bracket
4. User clicks teams to select
5. Each selection auto-saves to Firestore
6. Bracket locks after first save

RETURNING:
1. Load teams and game results
2. Load user's saved bracket
3. Show locked bracket with picks
4. Compare picks to results
5. Display green (correct) or red (incorrect) indicators
```

## Styling System

### Color Scheme
- **Primary**: Green (#16a34a) - Success, correct picks
- **Secondary**: Blue (#2563eb) - AFC, selections
- **Tertiary**: Red (#dc2626) - NFC, incorrect picks
- **Backgrounds**: Dark gradients (gray-900, slate-800)
- **Cards**: White with shadow-2xl

### Responsive Breakpoints
- Mobile: Single column, stacked layout
- Desktop (lg): Two columns, side-by-side

### Key Tailwind Classes
- Gradients: `bg-gradient-to-br from-{color}-900 via-{color}-800 to-{color}-900`
- Cards: `bg-white rounded-xl shadow-2xl p-6`
- Buttons: `bg-{color}-600 hover:bg-{color}-700 transition`
- Inputs: `focus:ring-2 focus:ring-{color}-500`

## Environment Variables

Required in `.env`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Deployment

### GitHub Pages (Automatic)
1. Push to main branch
2. GitHub Actions runs (.github/workflows/deploy.yml)
3. Builds with Firebase env vars from secrets
4. Deploys dist/ to gh-pages branch
5. Site live at username.github.io/repo-name

### Manual
```bash
npm run build
# Upload dist/ to any static host
```

## Security Considerations

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    match /userRooms/{docId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /brackets/{bracketId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Client-Side Validation
- Email format validation (HTML5)
- Password minimum length (Firebase default: 6 chars)
- Room code format (6 uppercase alphanumeric)
- Bracket lock enforcement (UI + Firestore rules)

## Future Enhancements

### Phase 2: Multi-Round Brackets
- Add Divisional, Conference, Super Bowl rounds
- Cascade picks (winner of WC game → Divisional matchup)
- Point system for each round

### Phase 3: Real-Time Features
- Firestore onSnapshot listeners for live updates
- Real-time leaderboard
- Push notifications for game results

### Phase 4: Social Features
- User profiles with avatars
- Room chat
- Share bracket on social media
- Invite friends via email

### Phase 5: Advanced Analytics
- Historical performance tracking
- Upset predictions
- Confidence points system
- Tiebreaker questions

## Known Limitations

1. **Mock Data**: Currently using hardcoded playoff teams
2. **Single Round**: Only Wild Card round implemented
3. **No Leaderboard**: Can't compare with other users in room
4. **Manual Results**: Game results must be manually updated
5. **No Undo**: Once bracket saved, cannot change picks
6. **No Validation**: Can select any team (no matchup logic)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Troubleshooting

### White Screen
- Check browser console for errors
- Verify Firebase credentials in .env
- Ensure all dependencies installed

### Firebase Errors
- Confirm Firebase project created
- Enable Email/Password auth
- Create Firestore database
- Check .env file matches Firebase config

### Build Errors
- Delete node_modules and package-lock.json
- Run `npm install` again
- Check Node version (requires 18+)

### Routing Issues on Deploy
- Verify base path in vite.config.js
- Add 404.html redirect for SPA routing
- Check GitHub Pages settings

## Testing Strategy

### Manual Testing Checklist
- [ ] Create account
- [ ] Login with existing account
- [ ] Create room (verify code generated)
- [ ] Join room with code
- [ ] Select teams in bracket
- [ ] Verify bracket saves
- [ ] Logout and login (bracket persists)
- [ ] Test with multiple users in same room
- [ ] Verify responsive design on mobile

### Future Automated Tests
- Unit tests for services (nflData.js)
- Integration tests for Firestore operations
- E2E tests for user flows (Playwright/Cypress)

## Performance Considerations

- Lazy load components with React.lazy()
- Memoize expensive calculations with useMemo()
- Debounce auto-save operations
- Optimize Firestore queries (use indexes)
- Implement pagination for large room lists
- Cache NFL data (localStorage or React Query)

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Color contrast ratios meet WCAG AA standards
- Screen reader friendly error messages

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 14+
- Chrome Mobile: Latest

## License & Credits

- React: MIT License
- Firebase: Google Terms of Service
- Tailwind CSS: MIT License
- Lucide Icons: ISC License
