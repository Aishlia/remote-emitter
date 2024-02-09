// UserPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase-config";
import { Link } from "react-router-dom";
import { parseMessage, extractStreet, extractZip } from "./utils";
import worldIcon from "./assets/world-icon192.svg";

function processConnections(rawConnections, viewingUsername, profileUsername) {
  let connectionsMap = {};
  let reverseConnectionsMap = {}; // To track reverse connections for bidirectional check

  // Initialize the connections map for all users mentioned
  rawConnections.forEach((conn) => {
    // Initialize maps if not already done
    if (!connectionsMap[conn.fromUser]) {
      connectionsMap[conn.fromUser] = new Set();
      reverseConnectionsMap[conn.fromUser] = new Set();
    }
    if (!connectionsMap[conn.toUser]) {
      connectionsMap[conn.toUser] = new Set();
      reverseConnectionsMap[conn.toUser] = new Set();
    }
    connectionsMap[conn.fromUser].add(conn.toUser);
    reverseConnectionsMap[conn.toUser].add(conn.fromUser); // Track reverse for bidirectional check
  });

  // Convert sets back to arrays for easier manipulation
  Object.keys(connectionsMap).forEach((user) => {
    connectionsMap[user] = Array.from(connectionsMap[user]);
  });

  let queue = [{ user: viewingUsername, path: [viewingUsername] }];
  let visited = new Set([viewingUsername]);

  while (queue.length > 0) {
    let { user, path } = queue.shift();

    if (user === profileUsername) {
      let displayChain = path.reduce((acc, currUser, index) => {
        if (index === path.length - 1) {
          return acc + `@${currUser}`; // For the last user, append without an arrow
        } else {
          const nextUser = path[index + 1];
          const symbol = reverseConnectionsMap[currUser].has(nextUser)
            ? " ↔ "
            : " → ";
          return acc + `@${currUser}${symbol}`;
        }
      }, "");

      return [{ display: displayChain }];
    }

    if (!connectionsMap[user]) continue;

    connectionsMap[user].forEach((nextUser) => {
      if (!visited.has(nextUser)) {
        visited.add(nextUser);
        queue.push({ user: nextUser, path: [...path, nextUser] });
      }
    });
  }

  return [{ display: "No continuous chain found." }];
}

function UserPage() {
  const [messages, setMessages] = useState([]);
  const [viewMode, setViewMode] = useState("posts"); // 'posts' or 'mentions'
  const [topHashtags, setTopHashtags] = useState([]);
  const { username } = useParams();
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    // Fetch posts or mentions based on viewMode
    let q;
    if (viewMode === "posts") {
      q = query(collection(db, "messages"), where("username", "==", username));
    } else {
      // 'mentions'
      q = query(
        collection(db, "messages"),
        where("mentions", "array-contains", username)
      );
    }

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMessages(msgs);
      // Aggregate and calculate top hashtags
      const allHashtags = msgs.flatMap((msg) => msg.hashtags || []);
      const hashtagFrequency = allHashtags.reduce((acc, hashtag) => {
        acc[hashtag] = (acc[hashtag] || 0) + 1;
        return acc;
      }, {});
      const sortedHashtags = Object.entries(hashtagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setTopHashtags(sortedHashtags);
    });

    const fetchAndProcessConnections = async () => {
      // Fetch all connections; consider implications for performance/data volume
      const connectionsQuery = query(collection(db, "connections"));
      const snapshot = await getDocs(connectionsQuery);
      const rawConnections = snapshot.docs.map((doc) => doc.data());

      const viewingUsername = localStorage.getItem("username");
      const processedConnections = processConnections(
        rawConnections,
        viewingUsername,
        username
      );

      setConnections(processedConnections);
    };

    fetchAndProcessConnections();

    return () => {
      unsubscribeMessages();
    };
  }, [username, viewMode]);

  const commonButtonStyle = {
    display: "inline-block", // Ensures that the width property is respected
    textAlign: "center",
    border: "none",
    margin: "0 10px", // Adds some space between buttons
    borderRadius: "20px", // Gives an oval shape suitable for longer text
    cursor: "pointer",
    transition: "all 0.3s ease", // Smooth transition for background and transform changes
    width: "120px", // Fixed width to ensure both buttons are the same size
    height: "40px", // Fixed height to maintain aspect ratio
    lineHeight: "40px", // Vertically centers text within the button
    fontSize: "16px", // Consistent font size
  };

  const activeButtonStyle = {
    ...commonButtonStyle,
    backgroundColor: "#007bff", // Primary color for active button
    color: "white",
    transform: "scale(1.05)", // Slightly enlarges the active button
  };

  const inactiveButtonStyle = {
    ...commonButtonStyle,
    backgroundColor: "rgba(0, 123, 255, 0.5)", // Faded blue for the inactive button
    color: "white",
    opacity: "0.7",
  };

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <Link
        to={`/${username}/world-locations`}
        className="world-icon-link-user-page"
      >
        <img
          src={worldIcon}
          alt="World Locations"
          style={{ maxWidth: "30px" }}
        />
      </Link>
      <div>
        {connections.length > 0 ? (
          connections.map((connection, index) => (
            <div key={index}>{connection.display}</div>
          ))
        ) : (
          <p>No connections found.</p>
        )}
      </div>
      <h2>{viewMode === "posts" ? `@${username}` : `@${username}`}</h2>
      <div
        style={{
          marginBottom: topHashtags.length === 0 ? "20px" : "0", // Conditionally apply bottom margin
        }}
      >
        <button
          style={viewMode === "posts" ? activeButtonStyle : inactiveButtonStyle}
          onClick={() => setViewMode("posts")}
        >
          Posts
        </button>
        <button
          style={
            viewMode === "mentions" ? activeButtonStyle : inactiveButtonStyle
          }
          onClick={() => setViewMode("mentions")}
        >
          Mentions
        </button>
      </div>
      {topHashtags.length > 0 && (
        <div>
          {topHashtags.map(([hashtag, count]) => (
            <div key={hashtag} style={{ margin: "10px 0" }}>
              <span style={{ fontWeight: "bold" }}>#{hashtag}</span>{" "}
              <span style={{ color: "#999" }}>({count})</span>
            </div>
          ))}
        </div>
      )}
      {messages.length > 0 ? (
        messages.map((message) => (
          <div key={message.id} className="submission">
            <div className="submission-header">
              <Link to={`/${message.username}`} className="username-link">
                {message.username ? `@${message.username}` : "Anonymous"}
              </Link>
            </div>
            <div className="submission-content">
              <p
                dangerouslySetInnerHTML={{ __html: parseMessage(message.text) }}
              ></p>
              <small>
                {new Date(message.timestamp).toLocaleDateString("en-US", {
                  month: "numeric",
                  day: "numeric",
                }) +
                  " " +
                  new Date(message.timestamp).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                -{" "}
                {(() => {
                  const street = extractStreet(message.address);
                  const zip = extractZip(message.address);
                  return street && zip ? `${street}, ${zip}` : "No Location";
                })()}
              </small>
            </div>
          </div>
        ))
      ) : (
        <div style={{ color: "#999", marginTop: "20px" }}>
          {viewMode === "posts" ? "No posts yet." : "No mentions yet."}
        </div>
      )}
    </div>
  );
}

export default UserPage;
