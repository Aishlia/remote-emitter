// CityPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase-config";
import { Link } from "react-router-dom";

function CityPage() {
  const [messages, setMessages] = useState([]);
  const { city } = useParams(); // Extract city from URL

  useEffect(() => {
    // Decode URI component in case city names contain spaces or special characters
    const cityName = decodeURIComponent(city);
    const q = query(
      collection(db, "messages"),
      where("address", "array-contains", cityName),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [city]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Posts from {decodeURIComponent(city)}</h2>
      {messages.map((message) => (
        <div key={message.id} className="submission">
          <div className="submission-header">
            <Link to={`/${message.username}`} className="username-link">
              {message.username ? `@${message.username}` : "Anonymous"}
            </Link>
          </div>
          <div className="submission-content">
            <p>{message.text}</p>
            <small>
              {new Date(message.timestamp).toLocaleString()} - {message.address}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CityPage;
