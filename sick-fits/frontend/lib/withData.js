import withApollo from 'next-with-apollo';
import ApolloClient from 'apollo-boost';
import { endpoint } from '../config';
import { LOCAL_STATE_QUERY } from '../components/Cart';

function createClient({ headers }) {
  return new ApolloClient({
    uri: process.env.NODE_ENV === 'development' ? endpoint : endpoint,
    request: operation => {
      operation.setContext({
        fetchOptions: {
          credentials: 'include',
        },
        headers,
      });
    },
    // local data
    clientState: {
      resolvers: {
        Mutation: {
          // { cache } = client
          toggleCart(_, variables, { cache }) {
            // 1 - read the cartOpen value from the cache
            const { cartOpen } = cache.readQuery({
              query: LOCAL_STATE_QUERY
            }) 

            // 2 - write the state to the opposite
            const data = {
              data: {
                cartOpen: !cartOpen
              }
            }
            cache.writeData(data);
            return data;
          }
        }
      },
      // the default state of the application
      defaults: {
        cartOpen: false
      }
    }
  });
}

export default withApollo(createClient);
