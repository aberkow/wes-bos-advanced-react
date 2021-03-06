const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { hasPermission } = require('../utils');
const { transport, makeNiceEmail } = require('../mail');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {

    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that.')
    }

    // ctx = context
    const item = await ctx.db.mutation.createItem({
      // bc all the args are going into the data, we can spread them instead of assigning each
      data: {
        // this is how to create a relationship between an item and a user in prisma
        user: {
          connect: {
            id: ctx.request.userId
          }
        },
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
    const item = await ctx.db.query.item({ where }, `{ id title user { id } }`);

    // check if they are allowed to delete it
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission))

    if (!ownsItem && hasPermissions) {
      throw new Error('You don\'t have permission to do that');
    } 

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

    // 3 - send reset token by email

    const mailRes = await transport.sendMail({
      from: 'adam@adamjberkowitz.com',
      to: user.email,
      subject: 'Your password reset token',
      html: makeNiceEmail(`Your Password Reset Token is here!
        \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to reset</a>`)
    })

    // 4 - return the message
    return { message: 'thanks!' }
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

  },
  async updatePermissions(parent, args, ctx, info) {
    // 1 - check if logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in')
    }

    // 2 - query current user
    const currentUser = await ctx.db.query.user({ 
      where: {
        id: ctx.request.userId
      }
    }, info);

    // 3 - check if they have permission to change permissions
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])

    // 4 - update the permissions
    return ctx.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions
        }
      },
      // passing in the args instead of the ctx bc a person might update someone else's permissions not their own. 
      where: {
        id: args.userId
      }
    }, info);
  },
  async addToCart(parent, args, ctx, info) {
    // 1 - is the user signed in?
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in.')
    }

    // 2 - query the user's current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    })

    // 3 - check if the item is already there and increment by 1
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1}
      }, info);
    }
    
    // 4 - if not, create a new cart item for the user
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId }
        },
        item: {
          connect: { id: args.id }
        }
      }
    }, info)

  },
  async removeFromCart(parent, args, ctx, info) {
    // 1 - find the cart item
    const cartItem = await ctx.db.query.cartItem({
      where: {
        id: args.id
      }
      // pass a manual query instead of info because 
      // we need to make sure we're getting the person who has the item in their cart
    }, `{ id, user { id} }`)

    // 1.5 make sure an item exists
    if (!cartItem) {
      throw new Error('No cart item found.');
    }

    // 2 - make sure they own the cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('No cheating!');
    }

    // 3 - delete the cart item
    return ctx.db.mutation.deleteCartItem({
      where: {
        id: args.id
      }
    }, info)
  },
  async createOrder(parent, args, ctx, info) {
    // 1 - query current user and make sure they're signed in
    const { userId } = ctx.request;
    if (!userId) throw new Error('You must be signed in to complete the order');

    // manually query the db based on the user.
    const user = await ctx.db.query.user({
      where: { id: userId }
    }, `{
          id 
          name 
          email 
          cart { 
            id 
            quantity 
            item { 
              title 
              price 
              id 
              description 
              image
              largeImage 
            }
          }
        }`)

    // 2 - recalculate the total for the price
    // if you only check on the client, people can change the price and send it.
    // by re-calculating on the server, that can't happen
    const amount = user.cart.reduce((tally, cartItem) => {
      return tally + cartItem.item.price * cartItem.quantity;
    }, 0);
    // 3 - create the stripe charge (turn the token into $$$)
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token
    })

    // 4 - convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        // object spread creates a top level copy
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      }
      // delete the id bc the new orderItem will get its own id.
      delete orderItem.id;
      return orderItem;
    })

    // 5 - create the order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } }
      }
    })

    // 6 - clear the user's cart and delete the cart items
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds
      }
    })

    // 7 - return the order to the client
    return order;
  }
};

module.exports = Mutations;
