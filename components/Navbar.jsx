// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Pricing from './Pricing';
import '../components/Navbar.css';

const Navbar = () => {
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const openPricing = () => {
    setIsPricingOpen(true);
  };

  const closePricing = () => {
    setIsPricingOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <h1 className="logo">WebNova AI</h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/builder">Builder</Link></li>
          <li><Link to="/history">History</Link></li>
          <li><button onClick={openPricing} className="pricing-btn">Pricing</button></li>
          <li>
            <button onClick={toggleTheme} className="theme-toggle-btn">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </li>
        </ul>
      </nav>
      <Pricing isOpen={isPricingOpen} onClose={closePricing} />
    </>
  );
};

export default Navbar;
