import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { collection, query, onSnapshot, addDoc, orderBy } from "firebase/firestore";
import { db } from './firebase-config';
import { Link } from 'react-router-dom';
import { parseMessage, extractStreet, extractZip } from './utils';
import worldIcon from './assets/world-icon192.svg';

const adjectives = ["Fast", "Silent", "Wandering", "Ancient", "Mystic", "Adventurous", "Beautiful", "Courageous", "Determined", "Energetic", "Fearless", "Generous", "Honest", "Innovative", "Joyful", "Kind", "Loyal", "Motivated", "Nurturing", "Optimistic", "Passionate", "Quirky", "Resilient", "Strong", "Thoughtful", "Unique", "Vibrant", "Wise", "Xenial", "Youthful", "Zealous"];
const nouns = ["Traveler", "Knight", "Wanderer", "Sage", "Hunter", "Architect", "Bee", "Cat", "Dolphin", "Elephant", "Falcon", "Giraffe", "Helicopter", "Island", "Jewel", "Koala", "Lion", "Mountain", "Nebula", "Owl", "Piano", "Quokka", "Robot", "Star", "Tree", "Unicorn", "Volcano", "Whale", "Xenops", "Yacht", "Zebra"];

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

    let storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      storedUsername = `${randomAdjective}${randomNoun}${Math.floor(Math.random() * 100)}`;
      localStorage.setItem('username', storedUsername);
    }
    setUsername(storedUsername);

    return () => unsubscribe();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent the default action (insert newline)
      handleSubmit(); // Call your submit function
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    // e.preventDefault();

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

    let locationData = {
      latitude: null,
      longitude: null,
      address: "No location"
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          locationData.latitude = position.coords.latitude;
          locationData.longitude = position.coords.longitude;
          try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}`);
            const addressComponents = response.data.address;
            locationData.address = `${addressComponents.house_number || ''} ${addressComponents.road || ''}, ${addressComponents.city || addressComponents.town || addressComponents.village || ''}, ${addressComponents.state || ''}, ${addressComponents.postcode || ''}, ${addressComponents.country || ''}`;
          } catch (error) {
            console.error("Error fetching address: ", error);
          }
          finally {
            await addMessage(locationData);
          }
        }, async () => {
          // Error callback or when access to location is denied
          await addMessage(locationData);
        });
      } else {
        console.error('Geolocation is not supported by your browser');
        await addMessage(locationData);
    }       
  };

  const addMessage = async (locationData) => {
    const timestamp = new Date().toISOString();
    const mentionRegex = /@(\w+)/g;
    const hashtagRegex = /#(\w+)/g;
    const mentions = [...text.matchAll(mentionRegex)].map(match => match[1]);
    const hashtags = [...text.matchAll(hashtagRegex)].map(match => match[1]);
    
    const message = {
      username: username || "Anonymous",
      text,
      timestamp,
      address: locationData.address,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      mentions,
      hashtags,
    };
    
      try {
        const docRef = await addDoc(collection(db, "messages"), message);
        // After successful message addition, add connections for mentions
        mentions.forEach(async (mention) => {
          const connection = {
            fromUser: username,
            toUser: mention,
            timestamp: new Date().toISOString(),
          };
          await addDoc(collection(db, "connections"), connection);
        });
  
        setText(''); // Clear text input after submission
        setErrorMessage(''); // Clear any error messages
      } catch (error) {
        console.error("Could not send the message: ", error);
        setErrorMessage('Failed to send message. Please try again.');
      }
    }

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
    <form onSubmit={handleSubmit} style={{ margin: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
      <Link to={`/${username}`} className="main-username-link">@{username}</Link>
      </div>
      <div className="input-with-icon">
      <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text here"
            rows="1" // Start with a single line
          />
        <i onClick={handleSubmit} className="submit-icon">→</i>
        <Link to={`/world-locations`} className="world-icon-link">
          <img src={worldIcon} alt="World Locations" style={{ maxWidth: '40px' }}/>
      </Link>
      </div>
      {errorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
    </form>
      {messages.map((message) => (
        <div key={message.id} className="submission">
            <div className="submission-header">
            <Link to={`/${message.username}`} className="username-link">{message.username ? `@${message.username}` : 'Anonymous'}</Link>
            </div>
            <div className="submission-content">
            <p dangerouslySetInnerHTML={{ __html: parseMessage(message.text) }}></p>
            <small>
                {new Date(message.timestamp).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                }) + ' ' + new Date(message.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
                }) + ' '}
                {/* Extract street and zip and check if both exist, else display "No Location" */}
                - {(() => {
                const street = extractStreet(message.address);
                const zip = extractZip(message.address);
                if (street && zip) {
                    return `${street}, ${zip}`;
                } else {
                    return "No Location";
                }
                })()}
            </small>
            </div>
        </div>
        ))}
    </div>
  );
}

export default HomePage;