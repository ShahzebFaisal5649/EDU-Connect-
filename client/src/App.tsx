import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import SessionRequests from './components/SessionRequests';
import Feedback from './components/Feedback';
import AdminRegister from './components/AdminRegister';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem('userRole')
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem('userId')
  );

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }, [isLoggedIn, userRole, userId]);



  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home Route with Login/Register Toggle */}
          <Route
            path="/"
            element={<Home
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              setIsLoggedIn={setIsLoggedIn}
              setUserRole={setUserRole}
              setUserId={setUserId}
            />}
          />

          {/* Admin Routes */}
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/login" element={<AdminLogin setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} setUserId={setUserId} />} />
          <Route
            path="/admin/dashboard"
            element={isLoggedIn && userRole === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/admin/login" />
            )}
          />


          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                userRole === 'admin' ? (
                  <Navigate to="/admin/dashboard" />
                ) : (
                  <Dashboard setIsLoggedIn={setIsLoggedIn} userRole={userRole} userId={userId} />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <Profile userId={userId} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Session Requests Route */}
          <Route
            path="/session-requests"
            element={
              isLoggedIn ? (
                <SessionRequests userRole={userRole} userId={userId} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Feedback Route */}
          <Route
            path="/feedback/:id"
            element={
              isLoggedIn ? (
                <Feedback />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;