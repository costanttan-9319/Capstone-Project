import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import Navbar from './components/Navbar';
import MobileNavBar from './components/MobileNavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from "./pages/Signup";
import TopPicks from './pages/TopPicks';
import Favourite from './pages/Favourite';
import MyStore from './pages/MyStore';
import ShareCard from './components/ShareCard';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminRequest from './pages/AdminRequest';
import './pages/pages.css';

function App() {
  const isMobile = useMediaQuery('(max-width:768px)');

  return (
    <Router>
      {isMobile ? <MobileNavBar /> : <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/top-picks" element={<TopPicks />} />
        <Route path="/favourite" element={<Favourite />} />
        <Route path="/my-store" element={<MyStore />} />
        <Route path="/store/:id" element={<ShareCard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin-requests" element={<AdminRequest />} />
      </Routes>
    </Router>
  );
}

export default App;