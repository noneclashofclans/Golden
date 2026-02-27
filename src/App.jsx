import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LandingPage from './pages/landing';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import ChatRoom from './pages/ChatRoom';

function App() {
  const location = useLocation();

  return (
    <div className="bg-[#0a0a0c] min-h-screen text-white">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          <Route path="/" element={<LandingPage />} />
{/*           
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/chat/:roomId" element={<ChatRoom />} /> */}
          
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;