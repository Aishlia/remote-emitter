// UserPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, orderBy, query, onSnapshot, where } from "firebase/firestore";
import { db } from './firebase-config';
import { Link } from 'react-router-dom';
import { parseMessage, extractStreet, extractZip } from './utils';

function UserPage() {
    const [messages, setMessages] = useState([]);
    const [viewMode, setViewMode] = useState('posts'); // 'posts' or 'mentions'
    const { username } = useParams();
  
    useEffect(() => {
      let q;
      if (viewMode === 'posts') {
        q = query(collection(db, "messages"), where("username", "==", username), orderBy("timestamp", "desc"));
      } else {
        q = query(collection(db, "messages"), where("mentions", "array-contains", username), orderBy("timestamp", "desc"));
      }
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setMessages(msgs);
      });
  
      return () => unsubscribe();
    }, [username, viewMode]);

    return (
        <div style={{ textAlign: 'center' }}>
          <h2>{viewMode === 'posts' ? `Posts by @${username}` : `Mentions of @${username}`}</h2>
          <button className="button" onClick={() => setViewMode('posts')}>Posts</button>
          <button className="button" onClick={() => setViewMode('mentions')}>Mentions</button>
          {messages.length > 0 ? (
            messages.map((message) => (
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
                    })} - {(() => {
                      const street = extractStreet(message.address);
                      const zip = extractZip(message.address);
                      return street && zip ? `${street}, ${zip}` : "No Location";
                    })()}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#999', marginTop: '20px' }}>
              {viewMode === 'posts' ? "No posts yet." : "No mentions yet."}
            </div>
          )}
        </div>
      );
      
}

export default UserPage;
