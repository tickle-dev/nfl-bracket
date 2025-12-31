# NFL Playoff Bracket Web App

A modern React web application for creating and managing NFL playoff brackets with friends.

## Features

- 🔐 User authentication (Firebase Auth)
- 🏈 NFL playoff bracket management
- 👥 Room-based sharing with unique codes
- 💾 Persistent bracket storage (Firestore)
- 🎨 Modern UI with Tailwind CSS
- ✅ Automatic game result tracking

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Copy your Firebase config

### 3. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Update Firebase Config
Edit `src/firebase.js` and replace the placeholder values with your actual Firebase config or use environment variables.

### 5. Run Development Server
```bash
npm run dev
```

### 6. Build for Production
```bash
npm run build
```

## Deployment to GitHub Pages

1. Install gh-pages:
```bash
npm install -D gh-pages
```

2. Add to `package.json`:
```json
"homepage": "https://yourusername.github.io/repository-name",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/repository-name/',
  plugins: [react()],
})
```

4. Deploy:
```bash
npm run deploy
```

## Firestore Collections Structure

### rooms
- `code`: string (unique room code)
- `createdAt`: timestamp

### userRooms
- `userId`: string
- `roomId`: string
- `roomCode`: string

### brackets
- Document ID: `{roomId}_{userId}`
- `userId`: string
- `roomId`: string
- `picks`: object (round_matchIndex: teamId)
- `submittedAt`: timestamp

## Tech Stack

- React 18
- Vite
- Firebase (Auth + Firestore)
- Tailwind CSS
- React Router
- Lucide React (icons)
- Axios (for future API calls)

## Future Enhancements

- Real-time score updates from ESPN/NFL.com API
- Leaderboard within rooms
- Push notifications for game results
- Social sharing features
- Mobile app version
