// src/components/Header.js
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext"; // We'll create this context soon

const Header = () => {
  const { user, logout } = useContext(AuthContext); // Access user and logout from context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect to login after logout
  };

  return (
    <header className="header">
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {user ? ( // Show different links based on authentication status
            <>
              <li>
                <Link to="/tasks">My Tasks</Link>
              </li>
              <li>
                <button className="btn" onClick={handleLogout}>
                  Logout ({user.username})
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
