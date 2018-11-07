const nodeMailer = require('nodemailer');

// create the email transport
const transport = nodeMailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

// create a basic email template
const makeNiceEmail = text => `
  <div className="email" 
    style="border: 1px solid black;
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px;">
      <h2>Hello!</h2>
      <p>${text}</p>
  </div>
`

exports.transport = transport;
exports.makeNiceEmail = makeNiceEmail