// This is a Vercel serverless function that will handle API requests
// It will be used in production to route requests to your backend

// Import the Express app from your server file
const { app } = require('../src/services');

module.exports = app;
