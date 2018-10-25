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
  }

};

module.exports = Mutations;
