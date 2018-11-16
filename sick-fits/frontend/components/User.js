import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import propTypes from 'prop-types';

const CURRENT_USER_QUERY = gql`
  query {
    me {
      id
      email
      name
      permissions
      cart {
        id
        quantity
        item {
          id
          price
          image
          title
          description
        }
      }
    }
  }
`;


// passing the payload like this lets you pass the payload to any children
// also we don't have to rewrite the query
const User = props => (
  <Query {...props} query={CURRENT_USER_QUERY}>
    {payload => props.children(payload)}
  </Query>
)

User.propTypes = {
  children: propTypes.func.isRequired
}


export default User;
export { CURRENT_USER_QUERY };