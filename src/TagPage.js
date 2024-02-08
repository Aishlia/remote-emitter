// TagPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from './firebase-config';
import { Link } from 'react-router-dom';
import { extractZip, extractStreet } from './utils'

function TagPage() {
  const [messages, setMessages] = useState([]);
  const { tag } = useParams(); // This gets the tag from the URL

  useEffect(() => {
    const q = query(collection(db, "messages"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const taggedMessages = querySnapshot.docs.map(doc => doc.data()).filter(message => message.text.includes(`#${tag}`));
      setMessages(taggedMessages);
    });

    return () => unsubscribe();
  }, [tag]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Posts tagged with #{tag}</h2>
      {messages.map((message, index) => (
        <div key={index} className="submission">
          <div className="submission-header">
            <Link to={`/${message.username}`} className="username-link">@{message.username}</Link>
          </div>
          <div className="submission-content">
            <p>{message.text}</p>
            <small>{new Date(message.timestamp).toLocaleString()} - {extractStreet(message.address)}, {extractZip(message.address)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TagPage;
