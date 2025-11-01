import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import VicePrincipalDashboard from "./pages/VicePrincipalDashboard";
import ActivitiesDashboard from "./pages/ActivitiesDashboard";
import EducationalSupervisionDashboard from "./pages/EducationalSupervisionDashboard";
import SocialSpecialistDashboard from "./pages/SocialSpecialistDashboard";
import QualityDashboard from "./pages/QualityDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import ChairmanDashboard from "./pages/ChairmanDashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Create axios instance with credentials
axios.defaults.withCredentials = true;

// Context for user authentication
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, rememberMe) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
        remember_me: rememberMe
      });
      setUser(response.data.user);
      toast.success("تم تسجيل الدخول بنجاح");
      return response.data.user;
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل تسجيل الدخول");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setUser(null);
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <div className="app-container rtl">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route
              path="/"
              element={
                user ? (
                  user.role === "admin" ? <AdminDashboard /> :
                  user.role === "chairman" ? <ChairmanDashboard /> :
                  user.role === "director" ? <DirectorDashboard /> :
                  user.role === "vice_principal" ? <VicePrincipalDashboard /> :
                  user.role === "supervisor" ? <SupervisorDashboard /> :
                  user.role === "activities" ? <ActivitiesDashboard /> :
                  user.role === "educational_supervision" ? <EducationalSupervisionDashboard /> :
                  user.role === "social_specialist" ? <SocialSpecialistDashboard /> :
                  user.role === "quality" ? <QualityDashboard /> :
                  <Navigate to="/login" />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
