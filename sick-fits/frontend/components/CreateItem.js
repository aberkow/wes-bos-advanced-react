import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';

const CREATE_ITEM_MUTATION = gql`
  mutation CREATE_ITEM_MUTATION(
    # these arguments are the same as in the backend graphql schema
    $title: String!
    $description: String!
    $price: Int!
    $image: String
    $largeImage: String
  ) {
    # create the item with the arguments
    createItem(
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
    ) {
      # return just the id
      id
    }
  }
`;

class CreateItem extends Component {
  // it helps to have an initial state to update before making the mutation request with apollo
  state = {
    title: '',
    description: '',
    image: '',
    largeImage: '',
    price: 0
  }
  // using an arrow function makes it an instance function where *this* is bound to the class
  handleChange = (evt) => {
    const { name, type, value } = evt.target;

    // if the type is a number, coerce it to a float
    const val = type === 'number' ? parseFloat(value) : value;

    // brackets here mean that the state of the *name* from evt.target.name will be updated.
    // this is a computed property name
    this.setState({ [name]: val })
  }
  render() {
    return (
      <Mutation mutation={CREATE_ITEM_MUTATION} variables={this.state}>
        {
          (createItem, { loading, error }) => (
            <Form onSubmit={(evt) => {
              // prevent the page from reloading
              evt.preventDefault();
              console.log(this.state)
            }}>
              <fieldset>
                <label htmlFor="title">
                  Title
              <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Title"
                    value={this.state.title}
                    onChange={this.handleChange}
                    required />
                </label>
                <label htmlFor="price">
                  Price
              <input
                    type="number"
                    id="price"
                    name="price"
                    placeholder="Price"
                    value={this.state.price}
                    onChange={this.handleChange}
                    required />
                </label>
                <label htmlFor="description">
                  Description
              <textarea
                    id="description"
                    name="description"
                    placeholder="Enter a description"
                    value={this.state.description}
                    onChange={this.handleChange}
                    required />
                </label>
                <button type="submit">Submit</button>
              </fieldset>
            </Form>
          )
        }
      </Mutation>
    )
  }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION };
