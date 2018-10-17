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
  }
};

module.exports = Mutations;
