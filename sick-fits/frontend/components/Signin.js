import React, { Component } from 'react'
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';

import { CURRENT_USER_QUERY } from './User';

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    signin(email: $email, password: $password) {
      id
      name
      email
    }
  }
`;

class Signin extends Component {
  state = {
    name: '',
    email: '',
    password: ''
  }
  saveToState = (evt) => {
    this.setState({ [evt.target.name]: evt.target.value })
  }
  render() {
    return (
      <Mutation 
        mutation={SIGNIN_MUTATION} 
        variables={this.state}
        // refetchQueries takes an array of queries to run after the mutation has finished.
        // this way the page doesn't need to be refreshed from the server
        refetchQueries={[ { query: CURRENT_USER_QUERY } ]}>
        {
          (signin, { error, loading }) => {
            return (
              <Form method="POST" onSubmit={async (evt) => {
                evt.preventDefault();
                await signin();
                this.setState({
                  name: '',
                  email: '',
                  password: ''
                })
              }}>
                <fieldset disabled={loading} aria-busy={loading}>
                  <h2>Sign in to your account</h2>
                  <Error error={error} />
                  <label htmlFor="email">
                    Email
                    <input id="email" name="email" placeholder="email" type="email" value={this.state.email} onChange={this.saveToState} />
                  </label>
                  <label htmlFor="password">
                    Password
                    <input id="password" name="password" placeholder="password" type="password" value={this.state.password} onChange={this.saveToState} />
                  </label>
                  <button type="submit">Sign In!</button>
                </fieldset>
              </Form>
            )
          }
        }
      </Mutation>
    )
  }
}
export default Signin;