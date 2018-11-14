import React, { Component, Fragment } from 'react';
import { Query, Mutation } from 'react-apollo';
import Error from './ErrorMessage';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';

import Table from './styles/Table';
import SickButton from './styles/SickButton';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
]

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation UPDATE_PERMISSIONS_MUTATION($permissions: [Permission], $userId: ID! ) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      permissions
      name
      email
    } 
  }
`;

const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      id
      name
      email
      permissions
    }
  }
`

const Permissions = (props) => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) => (
      <div>
        <Error error={error} />
        <div>
          <h2>Manage Permissions</h2>
          <Table>
            <thead>
              <tr>
                <th>
                  Name
                </th>
                <th>
                  Email
                </th>
                {possiblePermissions.map(permission => <th key={permission}>{permission}</th>)}
                <th>V</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => <UserPermissions key={user.id} user={user} />)}
            </tbody>
          </Table>
        </div>
      </div>
    )}
  </Query>
)

class UserPermissions extends Component {
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array
    }).isRequired
  }
  // never set state from props! except in this one case where props are seeding the data.
  state = {
    permissions: this.props.user.permissions
  }
  handlePermissionChange = (evt) => {
    const checkBox = evt.target;
    // take a copy of the current permissions
    // spreading the array makes a copy instead of manipulating the state directly first.
    let updatedPermissions = [...this.state.permissions];
    // figure out if the permission should be added or removed
    if (checkBox.checked) {
      updatedPermissions.push(checkBox.value);
    } else {
      updatedPermissions = updatedPermissions.filter(permission => permission !== checkBox.value);
    }
    // set the state.
    this.setState({ permissions: updatedPermissions }); 
  }
  render() {
    const user = this.props.user;
    return (
      <Mutation mutation={UPDATE_PERMISSIONS_MUTATION} variables={{
        permissions: this.state.permissions,
        userId: this.props.user.id
      }}>
        {(updatePermissions, { loading, error }) => (
          <Fragment>
            { error && <tr>
                <td colSpan="8">
                  <Error error={error} />
                </td>
              </tr>}
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              {possiblePermissions.map(permission => (
                <td key={permission}>
                  <label 
                    key={permission} 
                    htmlFor={`${user.id}-permission-${permission}`}>
                    <input 
                      id={`${user.id}-permission-${permission}`}
                      type="checkbox" 
                      checked={this.state.permissions.includes(permission)} 
                      value={permission}
                      onChange={this.handlePermissionChange} />
                  </label>
                </td>
              ))}
              <td>
                <SickButton 
                  type="button"
                  disabled={loading} 
                  onClick={updatePermissions}>
                  Updat{loading ? 'ing' : 'e'}
                </SickButton>
              </td>
            </tr>
          </Fragment>
        )}
      </Mutation>
    )
  
  }
}

export default Permissions;