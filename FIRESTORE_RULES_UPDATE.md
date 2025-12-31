# IMPORTANT: Update Firestore Rules

The reset bracket button requires updated Firestore security rules.

## Steps to Update Rules in Firebase Console:

1. Go to https://console.firebase.google.com/
2. Select your project: `nfl-bracket-b3140`
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top
5. Replace ALL the existing rules with the content below:
6. Click **Publish**

## Copy these rules exactly:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    
    // UserRooms collection
    match /userRooms/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Brackets collection - CRITICAL FOR RESET BUTTON
    match /brackets/{bracketId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null;
    }
  }
}
```

## Verify Rules Are Published:

After publishing, the rules should show a green checkmark and timestamp showing when they were last published.

## Test the Reset Button:

1. Go back to your app
2. Navigate to a bracket room
3. Click "Reset All Brackets" button
4. It should now work without permission errors

## Troubleshooting:

If you still get permission errors:
- Make sure you clicked "Publish" (not just save)
- Wait 10-30 seconds for rules to propagate
- Refresh your browser
- Check the Firebase Console Rules tab shows your new rules
