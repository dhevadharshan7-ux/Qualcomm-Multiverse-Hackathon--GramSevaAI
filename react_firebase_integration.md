# React ↔ Firebase Connection Guide

Follow these exact steps to connect your React frontend to the Gram Seva AI Firebase Architecture.

---

## Step 1: Install Firebase
Open your terminal, navigate to your **React frontend folder**, and install the Firebase client SDK:

```bash
npm install firebase
```

---

## Step 2: Get Your Public Web Config
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Open your `kaniyur-start-rgl5rk` project.
3. Click the **Gear Icon** (Project settings) > **General** tab.
4. Scroll down to **"Your apps"**. 
   - If there isn't a Web app yet, click the `</>` icon to add one.
   - If there is, copy the `firebaseConfig` object.

---

## Step 3: Initialize Firebase in React
Create a new file in your React project at `src/firebase.js` and paste the following code (replace the config block with the one you copied in Step 2):

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// REPLACE THIS with your actual config from Step 2
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "kaniyur-start-rgl5rk.firebaseapp.com",
  projectId: "kaniyur-start-rgl5rk",
  storageBucket: "kaniyur-start-rgl5rk.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database instance for your components to use
export const db = getFirestore(app);
```

---

## Step 4: Add Data (Create/Update)
Whenever you want to save data to PostgreSQL, you will push it into the `gram_seva_requests` Firebase collection.

Create a helper function (e.g., `src/api/citizenApi.js`):

```javascript
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function registerCitizen(citizenData) {
  // 1. Generate a unique request ID
  const requestId = "req_" + Date.now(); 
  
  // 2. Push the request to the queue
  await setDoc(doc(db, "gram_seva_requests", requestId), {
    action: "registerCitizen", // Must match the backend ActionRouter exactly
    status: "pending",
    payload: citizenData,
    timestamp: serverTimestamp()
  });
  
  return requestId;
}
```

---

## Step 5: Listen for the Response
After submitting a request, your React UI needs to know if PostgreSQL saved it successfully. You listen to the `gram_seva_responses` collection.

```javascript
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export function listenForBackendResponse(requestId, onSuccess, onError) {
  const unsubscribe = onSnapshot(doc(db, "gram_seva_responses", requestId), (snapshot) => {
    if (snapshot.exists()) {
      const response = snapshot.data();
      
      if (response.success) {
        onSuccess(response.data); // Data saved to PostgreSQL!
      } else {
        onError(response.message); // Validation failed in Backend
      }
      
      unsubscribe(); // Stop listening once we get the answer
    }
  });
}
```

---

## Step 6: Display Live Data on the Screen
To build a dashboard that updates instantly when PostgreSQL changes, listen to the `gram_seva_live` collection.

```javascript
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

export function useLiveCitizens() {
  const [citizens, setCitizens] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "gram_seva_live"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = [];
      snapshot.forEach((doc) => {
        // We filter to only grab citizen documents
        if (doc.data().type === 'citizen') {
            liveData.push(doc.data().data);
        }
      });
      setCitizens(liveData);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return citizens;
}
```

> [!TIP]
> **Summary of the Bridge**
> - You write to: `gram_seva_requests`
> - You read success/errors from: `gram_seva_responses`
> - You display live PostgreSQL data from: `gram_seva_live`
