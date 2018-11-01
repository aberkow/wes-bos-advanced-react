const { forwardTo } = require('prisma-binding');

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
