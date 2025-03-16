const express = require('express');
const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static('./'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './' });
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop');
});