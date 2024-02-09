// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./HomePage";
import UserPage from "./UserPage";
import CityPage from "./CityPage";
import TagPage from "./TagPage";
import WorldLocationsPage from "./WorldLocationsPage";
import UserWorldLocationsPage from "./UserWorldLocationsPage";
import logo from "./assets/logo192.png";

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: "10px" }}>
          <Link to="/">
            <img
              src={logo}
              alt="Home"
              style={{ maxWidth: "100px", cursor: "pointer" }}
            />
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:username" element={<UserPage />} />
          <Route path="/city/:city" element={<CityPage />} />
          <Route path="/tag/:tag" element={<TagPage />} />
          <Route path="/world-locations" element={<WorldLocationsPage />} />
          <Route
            path="/:username/world-locations"
            element={<UserWorldLocationsPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
