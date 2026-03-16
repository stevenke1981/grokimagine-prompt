import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((r) => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  // AuthCallback handles its own loading state — don't block it
  const isCallback = window.location.pathname === "/auth/callback";

  if (user === undefined && !isCallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/auth/callback"
        element={<AuthCallback setUser={setUser} />}
      />
      <Route
        path="/"
        element={
          user ? (
            <Home user={user} setUser={setUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
