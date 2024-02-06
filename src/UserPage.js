// UserPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, orderBy, query, onSnapshot, where } from "firebase/firestore";
import { db } from './firebase-config';
import axios from 'axios';

function UserPage() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const { username } = useParams(); // This gets the username from the URL

  useEffect(() => {
    const q = query(collection(db, "messages"), where("username", "==", username), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || text.length > 800) {
      setErrorMessage('Cannot submit an empty message and text submissions are limited to 800 characters.');
      return;
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
    // Use the username from useParams here instead of a conditional check
    const message = { username, text, timestamp, address };
    
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
      <h2>Posts by @{username}</h2>
      <form onSubmit={handleSubmit} style={{ margin: '20px' }}>
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
          <div className="submission-content">
            <p>{message.text}</p>
            <small>{new Date(message.timestamp).toLocaleString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserPage;
