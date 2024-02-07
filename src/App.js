// App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import HomePage from './HomePage';
import UserPage from './UserPage';
import CityPage from './CityPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:username" element={<UserPage />} />
          <Route path="/city/:city" element={<CityPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
