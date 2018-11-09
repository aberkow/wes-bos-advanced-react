const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// use express middleware for cookies (JWT) and populate current user
server.express.use(cookieParser());

// decode the jwt so we can get the user ID on each request
server.express.use((req, res, next) => {
  // the token cookie is created in the signup mutation
  // there may be other cookies as well which is why this is destructured.
  const { token } = req.cookies;

  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userId onto the request for future requests to access
    req.userId = userId;
  }

  next();
})

// create middleware that populates the user on each request
server.express.use(async (req, res, next) => {
  // if not logged in, skip
  if (!req.userId) return next();

  const user = await db.query.user({ where: { id: req.userId } }, '{ id, permissions, email, name }');
  
  req.user = user;
  next();
})

server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL
  }
}, deets => {
  console.log(`Server is now running on http://localhost:${deets.port}`)
})
