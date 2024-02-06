import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [username, setUsername] = useState('');

  const fetchAddress = async (lat, lon) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      return response.data.address.road || 'Address not found';
    } catch (error) {
      console.error("Error fetching address: ", error);
      return 'Error fetching address';
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      addSubmission("No location");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const address = await fetchAddress(latitude, longitude);
      addSubmission(address);
    }, () => {
      addSubmission("No location");
    });
  };
  
  const addSubmission = (address) => {
    const timestamp = new Date().toLocaleString();
    setSubmissions([{ text, timestamp, address }, ...submissions]);
    setText('');
  };  

  return (
    <div className="App" style={{ textAlign: 'center' }}>
      <form onSubmit={handleSubmit} style={{ margin: '20px' }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          style={{ marginRight: '10px', padding: '10px', marginBottom: '20px' }}
        />
        <br />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here"
          style={{ marginRight: '10px', padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px' }}>Submit</button>
      </form>
      {submissions.map((submission, index) => (
        <div key={index} className="submission">
          <div className="submission-header">
            <span>{username ? `@${username}` : 'Anonymous'}</span>
          </div>
          <div className="submission-content">
            <p>{submission.text}</p>
            <small>{submission.timestamp} {submission.address}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
