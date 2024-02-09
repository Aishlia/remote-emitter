// UserPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from './firebase-config';
import { Link } from 'react-router-dom';
import { parseMessage, extractStreet, extractZip } from './utils';
import worldIcon from './assets/world-icon192.svg';

function processConnections(rawConnections, username) {
  let processed = [];
  
  let connectionsMap = {};
  rawConnections.forEach(conn => {
    if (!connectionsMap[conn.fromUser]) {
      connectionsMap[conn.fromUser] = [];
    }
    connectionsMap[conn.fromUser].push(conn.toUser);
  });

  const buildChain = (current, chain = []) => {
    if (chain.includes(current)) {
      // Prevent infinite loops
      return;
    }
    if (!chain.length) {
      chain.push(username); // Start chain with the username
    }
    chain.push(current);
    if (connectionsMap[current]) {
      connectionsMap[current].forEach(next => buildChain(next, [...chain]));
    } else {
      // End of chain, save it
      processed.push(chain.join(" → "));
    }
  };

  if (connectionsMap[username]) {
    connectionsMap[username].forEach(user => buildChain(user));
  }

  rawConnections.filter(conn => conn.toUser === username && !processed.includes(`${conn.fromUser} → ${username}`)).forEach(conn => {
    processed.push(`${conn.fromUser} → ${username}`);
  });

  return processed.map(chain => ({display: chain}));
}


function UserPage() {
    const [messages, setMessages] = useState([]);
    const [viewMode, setViewMode] = useState('posts'); // 'posts' or 'mentions'
    const [topHashtags, setTopHashtags] = useState([]);
    const { username } = useParams();
    const [connections, setConnections] = useState([]);

    useEffect(() => {
      // Fetch posts or mentions based on viewMode
      let q;
      if (viewMode === 'posts') {
        q = query(collection(db, "messages"), where("username", "==", username));
      } else { // 'mentions'
        q = query(collection(db, "messages"), where("mentions", "array-contains", username));
      }
    
      const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setMessages(msgs);
        // Aggregate and calculate top hashtags
        const allHashtags = msgs.flatMap(msg => msg.hashtags || []);
        const hashtagFrequency = allHashtags.reduce((acc, hashtag) => {
          acc[hashtag] = (acc[hashtag] || 0) + 1;
          return acc;
        }, {});
        const sortedHashtags = Object.entries(hashtagFrequency).sort((a, b) => b[1] - a[1]).slice(0, 3);
        setTopHashtags(sortedHashtags);
      });
    
      // Fetch and process connections
      const fetchAndProcessConnections = async () => {
        const fromQuery = query(collection(db, "connections"), where("fromUser", "==", username));
        const toQuery = query(collection(db, "connections"), where("toUser", "==", username));
    
        const [fromSnapshot, toSnapshot] = await Promise.all([
          getDocs(fromQuery),
          getDocs(toQuery)
        ]);
    
        // Combine results from both queries
        const rawConnections = [
          ...fromSnapshot.docs.map(doc => ({...doc.data(), direction: 'outgoing'})),
          ...toSnapshot.docs.map(doc => ({...doc.data(), direction: 'incoming'}))
        ];
    
        // Process connections to determine the display logic
        const processedConnections = processConnections(rawConnections, username);
    
        setConnections(processedConnections);
      };
    
      fetchAndProcessConnections();
    
      return () => {
        unsubscribeMessages();
        // Add any additional cleanup here if necessary
      };
    }, [username, viewMode]);
    
  
    const commonButtonStyle = {
        display: 'inline-block', // Ensures that the width property is respected
        textAlign: 'center',
        border: 'none',
        margin: '0 10px', // Adds some space between buttons
        borderRadius: '20px', // Gives an oval shape suitable for longer text
        cursor: 'pointer',
        transition: 'all 0.3s ease', // Smooth transition for background and transform changes
        width: '120px', // Fixed width to ensure both buttons are the same size
        height: '40px', // Fixed height to maintain aspect ratio
        lineHeight: '40px', // Vertically centers text within the button
        fontSize: '16px', // Consistent font size
      };
    
      const activeButtonStyle = {
        ...commonButtonStyle,
        backgroundColor: '#007bff', // Primary color for active button
        color: 'white',
        transform: 'scale(1.05)', // Slightly enlarges the active button
      };
    
      const inactiveButtonStyle = {
        ...commonButtonStyle,
        backgroundColor: 'rgba(0, 123, 255, 0.5)', // Faded blue for the inactive button
        color: 'white',
        opacity: '0.7',
      };
    
      return (
        <div style={{ textAlign: 'center', position: 'relative' }}> {/* Add position: 'relative' to enable absolute positioning of the icon */}
        <Link to={`/${username}/world-locations`} className="world-icon-link-user-page">
          <img src={worldIcon} alt="World Locations" style={{ maxWidth: '30px' }}/>
      </Link>
      <div>
      {connections.length > 0 ? (
      connections.map((connection, index) => (
        <div key={index}>
          {connection.display}
        </div>
      ))
    ) : (
      <p>No connections found.</p>
    )}
</div>
        <h2>{viewMode === 'posts' ? `@${username}` : `@${username}`}</h2>
    <div
      style={{
        marginBottom: topHashtags.length === 0 ? '20px' : '0', // Conditionally apply bottom margin
      }}
    >
      <button
        style={viewMode === 'posts' ? activeButtonStyle : inactiveButtonStyle}
        onClick={() => setViewMode('posts')}
      >
        Posts
      </button>
      <button
        style={viewMode === 'mentions' ? activeButtonStyle : inactiveButtonStyle}
        onClick={() => setViewMode('mentions')}
      >
        Mentions
      </button>
          </div>
        {topHashtags.length > 0 && (
          <div>
            {topHashtags.map(([hashtag, count]) => (
              <div key={hashtag} style={{margin: "10px 0"}}>
                <span style={{fontWeight: "bold"}}>#{hashtag}</span> <span style={{color: "#999"}}>({count})</span>
              </div>
            ))}
          </div>
        )}
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
