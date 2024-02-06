import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { collection, query, onSnapshot, addDoc, orderBy } from "firebase/firestore";
import { db } from './firebase-config';
import { Link } from 'react-router-dom';

function HomePage() {
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
        setErrorMessage('Cannot submit an empty message');
        return; // Exit the function early if text is empty or whitespace
    }

    if (!text.trim() || text.length > 800) {
      setErrorMessage('Text submissions are limited to 800 characters.');
      return; // Prevent submission if the text is empty or too long
    }

    // Check for duplicate message within the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const isDuplicateRecentMessage = messages.some(message => 
        message.text === text && message.timestamp >= oneMinuteAgo
    );

    if (isDuplicateRecentMessage) {
        setErrorMessage("Sorry, this message was already posted in the last minute.");
        return; // Prevent submission of duplicate message
    }

    let address = "No location";

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          address = response.data.display_name || "Address not found";
        } catch (error) {
          console.error("Error fetching address: ", error);
        }
        finally {
          await addMessage(address);
        }
      }, async () => {
        // Error callback or when access to location is denied
        await addMessage(address);
      });
    } else {
      console.error('Geolocation is not supported by your browser');
      await addMessage(address);
    }
  };

  const addMessage = async (address) => {
    const timestamp = new Date().toISOString();
    const message = { username: username || "Anonymous", text, timestamp, address };
    
    try {
      await addDoc(collection(db, "messages"), message);
      setText(''); // Clear text input after submission
      setErrorMessage(''); // Clear any error messages
    } catch (error) {
      console.error("Could not send the message: ", error);
      setErrorMessage('Failed to send message. Please try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
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
      {messages.map((message) => (
        <div key={message.id} className="submission">
          <div className="submission-header">
          <Link to={`/${message.username}`} className="username-link">{message.username ? `@${message.username}` : 'Anonymous'}</Link>
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

export default HomePage;
