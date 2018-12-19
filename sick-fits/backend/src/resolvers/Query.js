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
  },
  async order(parent, args, ctx, info) {
    // 1 - make sure they're logged in
    if (!ctx.request.userId) {
      throw new Error('You are not logged in.')
    }
    // 2 - query the current order
    const order = await ctx.db.query.order({
      where: { id: args.id }
    }, info)
    // 3 - check if they have permission to see the order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermission = ctx.request.user.permissions.includes('ADMIN')

    if (!ownsOrder || !hasPermission) {
      throw new Error ('You can not see this order');
    }

    // 4 - return the order
    return order;
  },
  async orders(parent, args, ctx, info) {
    // 1 - make sure they're logged in
    if (!ctx.request.userId) {
      throw new Error('You are not logged in.')
    }
    return ctx.db.query.orders({
      where: {
        id: ctx.request.userId
      }
    }, info)
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
