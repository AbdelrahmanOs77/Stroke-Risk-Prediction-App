import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">StrokeRisk AI</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/predict">Predict</Link>
        <Link to="/history">History</Link>
        <Link to="/stats">Model Stats</Link>
        <Link to="/about">About</Link>
      </div>
    </nav>
  );
}
