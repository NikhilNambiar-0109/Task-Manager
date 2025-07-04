// src/pages/LoginPage.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext"; // Import AuthContext

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // State for error messages
  const { login, user } = useContext(AuthContext); // Get login function and user state from context
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/tasks"); // Redirect to tasks page if logged in
    }
  }, [user, navigate]); // Depend on 'user' and 'navigate'

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Clear previous errors
    setError("");

    const result = await login(email, password); // Call login function from context

    if (result.success) {
      // Login successful, useEffect will handle navigation
      // Optionally, you can show a success message here before redirect
    } else {
      // Login failed, display error message
      setError(
        result.message || "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}{" "}
      {/* Display error message */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-block">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
