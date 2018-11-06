const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const Mutations = {
  async createItem(parent, args, ctx, info) {

    // ctx = context
    const item = await ctx.db.mutation.createItem({
      // bc all the args are going into the data, we can spread them instead of assigning each
      data: {
        ...args
      }
      // passing info makes sure that the db returns the query
    }, info);
    return item;
  },

  updateItem(parent, args, ctx, info) {
    // first get a copy of the updates
    // the id is still needed to use in the resolver return
    // if you delete it directly from the args, it won't be available at all.
    const updates = {...args};

    // remove the id from the update. it shouldn't ever be updated.
    delete updates.id;
    
    // run the update
    return ctx.db.mutation.updateItem({
      data: updates,
      where: {
        id: args.id
      }
    }, 
    info
    )
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };

    // find the item
    const item = await ctx.db.query.item({ where }, `{ id title }`);

    // check if they are allowed to delete it
    // TODO

    // delete it!
    return ctx.db.mutation.deleteItem({ where }, info)

  },

  async signup(parent, args, ctx, info) {
    // important! make emails lowercase
    args.email = args.email.toLowerCase();
    // next, hash the password!
    // 10 is the length of the salt
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the db
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        // overwrite the password from args with the hashed password
        password,
        // bc the permissions is an enum, it needs to be 'set' like this...
        // everyone starts out as a USER
        permissions: { set: ['USER']}
      }
    }, info);
    // create the JWT for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set the JWT as a cookie on the response so the token comes along as they click through the site
    ctx.response.cookie('token', token, {
      // do not allow cookie to be accessed/used by JS
      httpOnly: true,
      // one year cookie
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1 - check if there is a user w the email
    const user = await ctx.db.query.user({ where: { email: email } });
    if (!user) {
      throw new Error(`No user found for email ${email}`);
    }

    // 2 - check if password is valid
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Invalid password`);
    }

    // 3 - generate jwt
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // 4 - set the cookie with the jwt
    ctx.response.cookie('token', token, {
      // do not allow cookie to be accessed/used by JS
      httpOnly: true,
      // one year cookie
      maxAge: 1000 * 60 * 60 * 24 * 365
    });

    // 5 - return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  async requestReset(parent, args, ctx, info) {
    // 1 - check if it's a real user
    const user = await ctx.db.query.user({ where: { email: args.email } })
    if (!user) {
      throw new Error(`No user found for email ${args.email}`);
    }

    // 2 - set reset token and expiry
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    // 1 hour from 'now'
    const resetTokenExpiry = Date.now() + 3600000;
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    })
    console.log(res, 'res')
    return { message: 'thanks!' }
    // 3 - send reset token by email
  },
  async resetPassword(parent, args, ctx, info) {
    // 1 - check if passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error('Passwords don\'t match');
    }

    // 2 - check if the reset token is ok
    // 3 - check if the token expired
    // user is the the first item in the destructured array of users.
    const [user] = await ctx.db.query.users({
      where: {
        // check that the token matches and that it's still valid
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });

    if (!user) {
      throw new Error('This token is either invalid or expired')
    }

    // 4 - hash the new password
    const password = await bcrypt.hash(args.password, 10);

    // 5 - save the new password to the user and remove old resetToken
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    // 6 - generate jwt
    const token = jwt.sign({ userId: updatedUser.id}, process.env.APP_SECRET)

    // 7 - set the jwt cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    })

    // 8 - return the new user
    return updatedUser;

  }
};

module.exports = Mutations;
