//neo4jDriver.js
const neo4j = require('neo4j-driver');

const uri = process.env.REACT_APP_NEO4J_URI;
const user = process.env.REACT_APP_NEO4J_USER;
const password = process.env.REACT_APP_NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

module.exports = driver;
