const cookieParser = require('cookie-parser');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// use express middleware for cookies (JWT) and populate current user
server.express.use(cookieParser());


server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL
  }
}, deets => {
  console.log(`Server is now running on http://localhost:${deets.port}`)
})
