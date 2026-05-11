import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar     from './components/Navbar';
import Home       from './pages/Home';
import Prediction from './pages/Prediction';
import History    from './pages/History';
import Stats      from './pages/Stats';
import About      from './pages/About';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />}       />
        <Route path="/predict" element={<Prediction />} />
        <Route path="/history" element={<History />}    />
        <Route path="/stats"   element={<Stats />}      />
        <Route path="/about"   element={<About />}      />
      </Routes>
    </Router>
  );
}

export default App;
