import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') ?? 'dark');

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  }

  return loggedIn
    ? <Dashboard onLogout={() => setLoggedIn(false)} theme={theme} toggleTheme={toggleTheme} />
    : <Login onLogin={() => setLoggedIn(true)} theme={theme} />;
}
