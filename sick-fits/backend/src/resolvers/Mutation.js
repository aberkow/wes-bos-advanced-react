const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  }
};

module.exports = Mutations;
