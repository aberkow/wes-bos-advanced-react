import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

const CURRENT_USER_QUERY = gql`
  query {
    me {
      id
      email
      name
      permissions
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

User.PropTypes = {
  children: PropTypes.func.isRequired
}


export default User;
export { CURRENT_USER_QUERY };