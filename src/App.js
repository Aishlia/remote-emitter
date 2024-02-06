import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { collection, query, onSnapshot, addDoc, orderBy } from "firebase/firestore"; // Import orderBy
import { db } from './firebase-config';

function App() {
  const [text, setText] = useState('');
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      console.error('Cannot submit an empty message');
      return; // Exit the function early if text is empty or whitespace
    }

    setErrorMessage('');

    if (!text.trim()) {
      console.error('Cannot submit an empty message');
      return;
    }

    if (text.length > 800) {
      setErrorMessage('Text submissions are limited to 800 characters.');
      return; // Prevent submission if the text is too long (800 char limit)
    }

    let address = "No location";

    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          address = response.data.display_name || "Address not found";
          addMessage(address);
        } catch (error) {
          console.error("Error fetching address: ", error);
          addMessage(address);
        }
      }, () => {
        addMessage(address);
      });
    } else {
      console.error('Geolocation is not supported by your browser');
      addMessage(address);
    }
  };

  const addMessage = async (address) => {
    const timestamp = new Date().toISOString();
    const message = { username: username || "Anonymous", text, timestamp, address };
    
    try {
      await addDoc(collection(db, "messages"), message);
      setText('');
    } catch (error) {
      console.error("Could not send the message: ", error);
    }
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
        {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
      </form>
      {/* <div className="messages-container">
        {messages.filter(message => message.text && message.text.trim()).map((message) => (
          <div key={message.id} className="submission">
            <div className="submission-header">
              <span>{message.username ? `@${message.username}` : 'Anonymous'}</span>
            </div>
            <div className="submission-content">
              <p>{message.text}</p>
              <small>{new Date(message.timestamp).toLocaleString()} - {message.address}</small>
            </div>
          </div>
        ))}
      </div> */}
      {messages.map((message) => (
        <div key={message.id} className="submission">
          <div className="submission-header">
            <span>{message.username ? `@${message.username}` : 'Anonymous'}</span>
          </div>
          <div className="submission-content">
            <p>{message.text}</p>
            <small>{new Date(message.timestamp).toLocaleString()} - {message.address}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
