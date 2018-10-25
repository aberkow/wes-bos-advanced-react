const { forwardTo } = require('prisma-binding');

const Query = {
  items: forwardTo('db'),
  item: forwardTo('db')
  // but for things like this where there's not authentication, or changes,
  // use forwardTo to send the query directly to the db.
  
  // the regular way to make the query.
  // async items(parent, args, ctx, info) {
  //   const items = await ctx.db.query.items();
  //   return items;
  // }
};

module.exports = Query;
