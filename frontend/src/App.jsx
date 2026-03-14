import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

import Home from './pages/Home';
import CookingMode from './pages/CookingMode';

function App() {
  return (
    <BrowserRouter>
      <header className="nav-header">
        <div className="container nav-content">
          <Link to="/" className="nav-logo">
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))' 
            }}>
              <ChefHat size={24} color="white" />
            </span>
            SousChef
          </Link>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" className="btn" style={{ background: 'transparent', color: 'var(--text-main)' }}>Home</Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<CookingMode />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
