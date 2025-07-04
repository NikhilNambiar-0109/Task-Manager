// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create the context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  // Initialize user state from local storage (if token exists)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To manage initial loading state

  // Backend API base URL
  const API_URL = "http://localhost:5000/api/auth/";

  useEffect(() => {
    // Function to load user from local storage (e.g., on app start)
    const loadUser = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        // In a real app, you'd verify this token with your backend
        // For simplicity here, we'll just assume token presence means logged in
        // (Though a backend /api/auth/me route is better for token validation)
        try {
          // Optionally, you can add a route like /api/auth/profile on backend
          // that accepts JWT and returns user data to validate token
          // const res = await axios.get('http://localhost:5000/api/auth/profile', {
          //     headers: { Authorization: `Bearer ${storedToken}` }
          // });
          // setUser(res.data);

          // For now, let's just assume if token exists, we fetch username for display
          // This is a placeholder; real-world apps should validate the token server-side
          // Or parse the token if you store username in payload
          const storedUser = localStorage.getItem("user"); // Assuming you'll store user object
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Fallback if user object isn't stored, but token is.
            // Ideally, refetch user data from backend with the token.
            setUser({ username: "User" }); // Generic placeholder
          }

          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error("Failed to load user from token:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []); // Run once on component mount

  // Register User
  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_URL}register`, {
        username,
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
        })
      );
      setUser({
        _id: res.data._id,
        username: res.data.username,
        email: res.data.email,
      });
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.data.token}`; // Set default header for subsequent requests
      return { success: true };
    } catch (error) {
      console.error(
        "Registration error:",
        error.response ? error.response.data : error.message
      );
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Login User
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
        })
      );
      setUser({
        _id: res.data._id,
        username: res.data.username,
        email: res.data.email,
      });
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.data.token}`; // Set default header for subsequent requests
      return { success: true };
    } catch (error) {
      console.error(
        "Login error:",
        error.response ? error.response.data : error.message
      );
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout User
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    delete axios.defaults.headers.common["Authorization"]; // Remove auth header
  };

  // Context value to be provided to consumers
  const authContextValue = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
