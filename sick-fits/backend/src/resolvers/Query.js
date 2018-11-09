const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');

// info contains the graphql query that contains the fields being requested

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // check if there is a current user ID
    // it's request not req!
    if (!ctx.request.userId) {
      // return null bc someone might not be logged in
      return null;
    }
    return ctx.db.query.user({
      where: { id: ctx.request.userId }
    }, info);
  },
  async users(parent, args, ctx, info) {
    // 1 - check if the user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in.')
    }

    // 2 - check if user has permission to query all users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])

    // 3 - if so, query all users
    return ctx.db.query.users({}, info);
  }
  // but for things like this where there's not authentication, or changes,
  // use forwardTo to send the query directly to the db.
  
  // the regular way to make the query.
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
