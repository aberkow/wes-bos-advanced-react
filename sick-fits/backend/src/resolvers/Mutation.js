const Mutations = {
  createDog(parent, args, context, info) {
    global.dogs = global.dogs || [];
    const newDog = { name: args.name }
    console.log(args)
    global.dogs.push(newDog);
    return newDog;
  }
};

module.exports = Mutations;
