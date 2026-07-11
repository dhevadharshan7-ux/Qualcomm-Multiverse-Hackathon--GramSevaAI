import { useRef, useState } from 'react';

/**
 * Records mic audio and hands the resulting Blob to onRecorded. Requires an
 * explicit tap to start (no passive listening — see DATA_GOVERNANCE.md §2)
 * and shows a visible recording state the whole time the mic is live.
 */
export default function VoiceRecorder({ onRecorded, disabled }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied or unavailable.');
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
      <button
        type="button"
        className={`mic-btn ${recording ? 'recording' : ''}`}
        onClick={recording ? stop : start}
        disabled={disabled}
        aria-label={recording ? 'Stop recording' : 'Start voice recording'}
      >
        {recording ? '■' : '🎤'}
      </button>
      <p style={{ fontSize: 13 }}>
        {recording ? 'Recording — tap to stop' : 'Tap to record your complaint'}
      </p>
      <p className="consent-banner">
        Your voice is transcribed locally and not stored after transcription.
      </p>
      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
    </div>
  );
}
