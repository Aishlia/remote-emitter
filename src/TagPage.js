// TagPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, onSnapshot, where, orderBy } from "firebase/firestore";
import { db } from './firebase-config';
import { Link } from 'react-router-dom';
import { parseMessage, extractStreet, extractZip } from './utils';

function TagPage() {
  const [messages, setMessages] = useState([]);
  const { tag } = useParams(); // This gets the tag from the URL

  useEffect(() => {
    const q = query(collection(db, "messages"), where("hashtags", "array-contains", tag), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const taggedMessages = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setMessages(taggedMessages);
    });
  
    return () => unsubscribe();
  }, [tag]);  

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Posts tagged with #{tag}</h2>
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

export default TagPage;
