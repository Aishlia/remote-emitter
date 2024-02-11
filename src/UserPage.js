// UserPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "./firebase-config";
import { Link } from "react-router-dom";
import { parseMessage, extractStreet, extractZip } from "./utils";
import worldIcon from "./assets/world-icon192.svg";
import driver from "./neo4jDriver";

function UserPage() {
  const [messages, setMessages] = useState([]);
  const [viewMode, setViewMode] = useState("posts"); // 'posts' or 'mentions'
  const [topHashtags, setTopHashtags] = useState([]);
  const { username } = useParams();
  const [connections, setConnections] = useState([]);
  const viewingUsername = localStorage.getItem("username");

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

    const fetchConnections = async () => {
      const session = driver.session({ database: "neo4j" });
      try {
        const result = await session.readTransaction((tx) =>
          tx.run(
            `
            MATCH (viewing:User {username: $viewingUsername}), (profile:User {username: $username})
            MATCH p=shortestPath((viewing)-[:MENTIONS*]-(profile))
            RETURN [n IN nodes(p) | n.username] AS usernames
          `,
            { viewingUsername, username }
          )
        );

        if (
          result.records.length > 0 &&
          result.records[0].get("usernames").length > 1
        ) {
          const pathUsernames = result.records[0].get("usernames");
          const connectionPath = pathUsernames.map((u) => `@${u}`).join(" - ");
          setConnections([connectionPath]);
        } else {
          setConnections(["No connection found."]);
        }
      } catch (error) {
        console.error("Failed to fetch connections:", error);
      } finally {
        await session.close();
      }
    };

    fetchConnections();

    return () => {
      unsubscribeMessages();
    };
  }, [username, viewMode, viewingUsername]);

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
            <div key={index}>{connection}</div>
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
