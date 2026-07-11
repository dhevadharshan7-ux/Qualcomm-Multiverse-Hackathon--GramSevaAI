import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavTabs from './components/NavTabs';
import Home from './pages/Home';
import RegisterGrievance from './pages/RegisterGrievance';
import GrievanceDetail from './pages/GrievanceDetail';
import MyGrievances from './pages/MyGrievances';
import IDUpdateRequest from './pages/IDUpdateRequest';
import IDRequestDetail from './pages/IDRequestDetail';
import Profile from './pages/Profile';

function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? initial);
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue];
}

export default function App() {
  const [language, setLanguage] = usePersistentState('gs_language', 'en');
  const [phone, setPhone] = usePersistentState('gs_phone', '');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  return (
    <div className="app-shell">
      <div className="liquid-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <Routes>
        <Route path="/" element={<Home language={language} setLanguage={setLanguage} />} />
        <Route path="/grievances" element={<MyGrievances />} />
        <Route path="/grievances/new" element={<RegisterGrievance language={language} />} />
        <Route path="/grievances/:id" element={<GrievanceDetail />} />
        <Route path="/id-requests" element={<IDUpdateRequest language={language} />} />
        <Route path="/id-requests/:id" element={<IDRequestDetail />} />
        <Route
          path="/profile"
          element={
            <Profile
              phone={phone}
              setPhone={setPhone}
              language={language}
              setLanguage={setLanguage}
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
            />
          }
        />
      </Routes>

      <NavTabs />
    </div>
  );
}
