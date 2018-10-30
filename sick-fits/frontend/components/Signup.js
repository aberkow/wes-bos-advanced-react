import React, { Component } from 'react'
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';

const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION($email: String!, $name: String!, $password: String!) {
    signup(name: $name, email: $email, password: $password) {
      id
      name
      email
    }
  }
`;

class Signup extends Component {
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
      <Mutation mutation={SIGNUP_MUTATION} variables={this.state}>
        {
          (signup, { error, loading }) => {
            return (
              <Form method="POST" onSubmit={async (evt) => {
                evt.preventDefault();
                await signup();
                this.setState({
                  name: '',
                  email: '',
                  password: ''
                })
              }}>
                <fieldset disabled={loading} aria-busy={loading}>
                  <h2>Sign up for an account</h2>
                  <Error error={error} />
                  <label htmlFor="email">
                    Email
                    <input id="email" name="email" placeholder="email" type="email" value={this.state.email} onChange={this.saveToState} />
                  </label>
                  <label htmlFor="name">
                    Name
                    <input id="name" name="name" placeholder="name" type="text" value={this.state.name} onChange={this.saveToState} />
                  </label>
                  <label htmlFor="password">
                    Password
                    <input id="password" name="password" placeholder="password" type="password" value={this.state.password} onChange={this.saveToState} />
                  </label>
                  <button type="submit">Sign Up!</button>
                </fieldset>
              </Form>
            )
          }
        }
      </Mutation>
    )
  }
}
export default Signup;