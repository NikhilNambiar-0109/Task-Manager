// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // We'll create this
import LoginPage from "./pages/LoginPage"; // We'll create this
import RegisterPage from "./pages/RegisterPage"; // We'll create this
import TasksPage from "./pages/TasksPage"; // We'll create this
import Header from "./components/Header"; // We'll create this

function App() {
  return (
    <Router>
      <Header /> {/* This will be our navigation bar */}
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          {/* Add more routes here as needed */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;
