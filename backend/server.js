require('dotenv').config();

const app = require('./src/app');

// Start server when running locally (npm start)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// Export the app for Vercel serverless
module.exports = app;
