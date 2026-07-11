// Direct calls to the Python orchestrator (voice, grievances, ID-update
// requests) — these need low-latency LAN access to the local Whisper/Gemma
// models, so they bypass the Firebase bridge and hit the orchestrator's
// REST API directly. Set VITE_ORCHESTRATOR_URL if it's not co-located with
// the website (intranet deployment — point at the compute hub's LAN IP).
const BASE_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8000';

async function asJson(res) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export function orchestrateText({ transcript, language = 'en', channel = 'form', citizenId = null }) {
  return fetch(`${BASE_URL}/orchestrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, language, channel, citizen_id: citizenId }),
  }).then(asJson);
}

export function orchestrateVoice({ audioBlob, language = 'en', channel = 'voice', citizenId = null }) {
  const form = new FormData();
  form.append('audio', audioBlob, 'recording.webm');
  form.append('language', language);
  form.append('channel', channel);
  if (citizenId) form.append('citizen_id', citizenId);
  return fetch(`${BASE_URL}/orchestrate/voice`, { method: 'POST', body: form }).then(asJson);
}

export function createGrievance(payload) {
  return fetch(`${BASE_URL}/grievances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(asJson);
}

export function getGrievance(id) {
  return fetch(`${BASE_URL}/grievances/${id}`).then(asJson);
}

export function createIdRequest(payload) {
  return fetch(`${BASE_URL}/id-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(asJson);
}

export function getIdRequest(id) {
  return fetch(`${BASE_URL}/id-requests/${id}`).then(asJson);
}

export function attachIdRequestDocument(id, file) {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${BASE_URL}/id-requests/${id}/document`, { method: 'POST', body: form }).then(asJson);
}
