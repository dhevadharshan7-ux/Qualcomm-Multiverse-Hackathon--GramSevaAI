// Implements the exact bridge contract from react_firebase_integration.md:
// write to gram_seva_requests, listen on gram_seva_responses, read
// gram_seva_live. Used for citizen/scheme-domain actions that the Node
// backend owns (per the teammate's doc) — grievance/ID-request/voice flows
// go straight to the Python orchestrator instead (see api/orchestrator.js).
import { doc, setDoc, onSnapshot, collection, query, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfigured } from '../firebase';

export async function sendBridgeRequest(action, payload) {
  if (!firebaseConfigured) {
    throw new Error('Firebase is not configured — set VITE_FIREBASE_* env vars to enable this.');
  }
  const requestId = 'req_' + Date.now();
  await setDoc(doc(db, 'gram_seva_requests', requestId), {
    action,
    status: 'pending',
    payload,
    timestamp: serverTimestamp(),
  });
  return requestId;
}

export function listenForBridgeResponse(requestId, onSuccess, onError) {
  if (!firebaseConfigured) {
    onError('Firebase is not configured.');
    return () => {};
  }
  const unsubscribe = onSnapshot(doc(db, 'gram_seva_responses', requestId), (snapshot) => {
    if (!snapshot.exists()) return;
    const response = snapshot.data();
    if (response.success) {
      onSuccess(response.result ?? response.data);
    } else {
      onError(response.message ?? response.error ?? 'Request failed');
    }
    unsubscribe();
  });
  return unsubscribe;
}

// Subscribes to the gram_seva_live mirror, filtered by `type` (matches the
// shape the Node backend's liveSync job writes: {type, data}).
export function subscribeLive(entityType, onData) {
  if (!firebaseConfigured) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, 'gram_seva_live'));
  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.type === entityType) items.push(d.data);
    });
    onData(items);
  });
}
