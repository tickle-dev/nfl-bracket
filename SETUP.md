# Quick Setup Guide

## Step 1: Firebase Setup (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "nfl-bracket" and follow the wizard
4. In your project, click the web icon (</>)
5. Register your app
6. Copy the firebaseConfig object

## Step 2: Enable Firebase Services

### Authentication:
1. Go to Authentication → Get Started
2. Click "Email/Password" → Enable → Save

### Firestore:
1. Go to Firestore Database → Create Database
2. Start in "Test mode" (change rules later)
3. Select a location close to you

## Step 3: Configure Environment

Create `.env` file in project root:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Step 4: Run Locally

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Step 5: Deploy to GitHub Pages

1. Push code to GitHub repository
2. Go to Settings → Secrets → Actions
3. Add all VITE_FIREBASE_* secrets
4. Push to main branch - auto deploys!

## Firestore Security Rules (Production)

Replace test mode rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    match /userRooms/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /brackets/{bracketId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Testing

1. Create account
2. Create a room (note the code)
3. Open incognito window
4. Create another account
5. Join room with the code
6. Both users can now fill brackets!
