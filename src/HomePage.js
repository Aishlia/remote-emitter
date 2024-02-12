// HomePage.js
import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./App.css";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  orderBy,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase-config";
import { Link } from "react-router-dom";
import { parseMessage, extractStreet, extractZip } from "./utils";
import worldIcon from "./assets/world-icon192.svg";
import driver from "./neo4jDriver";

const adjectives = [
  "Fast",
  "Silent",
  "Wandering",
  "Ancient",
  "Mystic",
  "Adventurous",
  "Beautiful",
  "Courageous",
  "Determined",
  "Energetic",
  "Fearless",
  "Generous",
  "Honest",
  "Innovative",
  "Joyful",
  "Kind",
  "Loyal",
  "Motivated",
  "Nurturing",
  "Optimistic",
  "Passionate",
  "Quirky",
  "Resilient",
  "Strong",
  "Thoughtful",
  "Unique",
  "Vibrant",
  "Wise",
  "Xenial",
  "Youthful",
  "Zealous",
];
const nouns = [
  "Traveler",
  "Knight",
  "Wanderer",
  "Sage",
  "Hunter",
  "Architect",
  "Bee",
  "Cat",
  "Dolphin",
  "Elephant",
  "Falcon",
  "Giraffe",
  "Helicopter",
  "Island",
  "Jewel",
  "Koala",
  "Lion",
  "Mountain",
  "Nebula",
  "Owl",
  "Piano",
  "Quokka",
  "Robot",
  "Star",
  "Tree",
  "Unicorn",
  "Volcano",
  "Whale",
  "Xenops",
  "Yacht",
  "Zebra",
];

function HomePage() {
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState("Global");
  const [userTags, setUserTags] = useState([]);

  // Retrieve username from localStorage or assign new random username
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      const randomAdjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const newUsername = `${randomAdjective}${randomNoun}${Math.floor(
        Math.random() * 100
      )}`;
      localStorage.setItem("username", newUsername);
      setUsername(newUsername);
    }
  }, []);

  // Fetch user's interests once username is set
  useEffect(() => {
    if (username) {
      const interestsRef = collection(db, "interests");
      const q = query(interestsRef, where("userID", "==", username));
      getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          setUserTags(doc.data().tags || []);
        });
      });
    }
  }, [username]);

  // Show posts based on viewMode
  useEffect(() => {
    let q;
    if (viewMode === "Global") {
      q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    } else if (viewMode === "Home" && userTags.length > 0) {
      q = query(
        collection(db, "messages"),
        where("hashtags", "array-contains-any", userTags),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [viewMode, userTags]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const addMention = async (fromUser, toUser) => {
    const session = driver.session({ database: "neo4j" });

    try {
      // Create or update the mentions relationship in both directions
      await session.writeTransaction((tx) =>
        tx.run(
          `
          MERGE (a:User {username: $fromUser})
          MERGE (b:User {username: $toUser})
          MERGE (a)-[:MENTIONS]->(b)
          MERGE (b)-[:MENTIONS]->(a)
        `,
          { fromUser, toUser }
        )
      );

      console.log(
        `Mention relationship created or updated between ${fromUser} and ${toUser}`
      );
    } catch (error) {
      console.error("Error creating/updating mention relationship:", error);
    } finally {
      await session.close();
    }

    // Framework for directional connections (for now, treat all mentions as directional)
    // try {
    //   // First, try to create a MENTIONS relationship if it doesn't exist
    //   let result = await session.writeTransaction(tx =>
    //     tx.run(`
    //       MERGE (a:User {username: $fromUser})
    //       MERGE (b:User {username: $toUser})
    //       MERGE (a)-[r:MENTIONS]->(b)
    //       ON CREATE SET r.count = 1
    //       ON MATCH SET r.count = r.count + 1
    //       RETURN r
    //     `, { fromUser, toUser })
    //   );

    //   // Check if there is a reciprocal mention
    //   const reciprocalResult = await session.writeTransaction(tx =>
    //     tx.run(`
    //       MATCH (a:User {username: $fromUser})<-[r:MENTIONS]-(b:User {username: $toUser})
    //       RETURN r
    //     `, { fromUser, toUser })
    //   );

    //   if (reciprocalResult.records.length > 0) {
    //     // If there is a reciprocal mention, update both relationships to BIDIRECTIONAL
    //     await session.writeTransaction(tx =>
    //       tx.run(`
    //         MATCH (a:User {username: $fromUser}), (b:User {username: $toUser})
    //         MERGE (a)-[r1:MENTIONS]->(b)
    //         MERGE (b)-[r2:MENTIONS]->(a)
    //         SET r1.bidirectional = true, r2.bidirectional = true
    //       `, { fromUser, toUser })
    //     );
    //   }

    //   console.log(`Mention added/updated from ${fromUser} to ${toUser}`);
    // } catch (error) {
    //   console.error("Error adding/updating mention:", error);
    // } finally {
    //   await session.close();
    // }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || text.length > 800) {
      setErrorMessage("Text submissions are limited to 800 characters.");
      return;
    }

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const isDuplicateRecentMessage = messages.some(
      (message) => message.text === text && message.timestamp >= oneMinuteAgo
    );
    if (isDuplicateRecentMessage) {
      setErrorMessage(
        "Sorry, this message was already posted in the last minute."
      );
      return;
    }

    let locationData = {
      latitude: null,
      longitude: null,
      address: "No location",
    };

    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const addressComponents = response.data.address;
        const formattedAddress = {
          house_number: addressComponents.house_number || '',
          road: addressComponents.road || '',
          city: addressComponents.city || addressComponents.town || addressComponents.village || '',
          state: addressComponents.state || '',
          postcode: addressComponents.postcode || '',
          country: addressComponents.country || ''
        };
        locationData.latitude = position.coords.latitude;
        locationData.longitude = position.coords.longitude;
        locationData.address = `${formattedAddress.house_number} ${formattedAddress.road}, ${formattedAddress.city}, ${formattedAddress.state}, ${formattedAddress.postcode}, ${formattedAddress.country}`;
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
      };
  };

  const handleViewModeChange = (mode) => (event) => {
    event.preventDefault();
    setViewMode(mode);
  };

  const addMessage = async (locationData) => {
    const timestamp = new Date().toISOString();
    const mentionRegex = /@(\w+)/g;
    const hashtagRegex = /#(\w+)/g;
    const mentions = [...text.matchAll(mentionRegex)].map((match) => match[1]);
    const hashtags = [...text.matchAll(hashtagRegex)].map((match) => match[1]);

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
      await addDoc(collection(db, "messages"), message);
      // After successful message addition, update user's interests with hashtags
      if (hashtags.length > 0) {
        const interestsRef = collection(db, "interests");
        const q = query(interestsRef, where("userID", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          // If user does not have interests document, create one
          await addDoc(interestsRef, {
            userID: username,
            tags: hashtags,
          });
        } else {
          // If user already has interests document, update it with new hashtags
          querySnapshot.forEach(async (doc) => {
            const existingTags = doc.data().tags || [];
            const updatedTags = [...new Set([...existingTags, ...hashtags])]; // Combine and remove duplicates
            await updateDoc(doc.ref, { tags: updatedTags });
          });
        }
      }
      mentions.forEach((mention) => {
        addMention(username, mention);
      });
      setText(""); // Clear text input after submission
      setErrorMessage(""); // Clear any error messages
    } catch (error) {
      console.error("Could not send the message: ", error);
      setErrorMessage("Failed to send message. Please try again.");
    }
  };

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <form onSubmit={handleSubmit} style={{ margin: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link to={`/${username}`} className="main-username-link">
            @{username}
          </Link>
        </div>
        <div className="input-with-icon">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text here"
            rows="1" // Start with a single line
          />
          <i onClick={handleSubmit} className="submit-icon">
            →
          </i>
          <Link to={`/world-locations`} className="world-icon-link">
            <img
              src={worldIcon}
              alt="World Locations"
              style={{ maxWidth: "40px" }}
            />
          </Link>
        </div>
        {errorMessage && (
          <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>
        )}
        <div style={{ margin: "10px 0" }}>
          <button
            className={`button ${
              viewMode === "Global" ? "button-active" : "button-inactive"
            }`}
            onClick={handleViewModeChange("Global")}
          >
            Global
          </button>
          <button
            className={`button ${
              viewMode === "Home" ? "button-active" : "button-inactive"
            }`}
            onClick={handleViewModeChange("Home")}
          >
            Home
          </button>
        </div>
      </form>
      {messages.map((message) => (
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
                }) +
                " "}
              {/* Extract street and zip and check if both exist, else display "No Location" */}
              -{" "}
              {(() => {
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
