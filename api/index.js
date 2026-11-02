/**
 * FoodWala Vercel Serverless Function Entry Point
 * 
 * Exports the Express app instance configured in server/server.js
 * to handle all /api/* routes on Vercel Edge/Serverless platform.
 */

const app = require('../server/server');

module.exports = app;
