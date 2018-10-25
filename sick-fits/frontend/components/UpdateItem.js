import React, { Component } from 'react';
import { Mutation, Query } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import ErrorMessage from './ErrorMessage';

// the form needs to know which item is being updated to display the current information to the user.
// to do that, we need another query.

const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      id
      title
      description
      price
    }
  }
`;

const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    # these arguments are the same as in the backend graphql schema
    $id: ID!
    $title: String
    $description: String
    $price: Int
    # $image: String
    # $largeImage: String
  ) {
    # create the item with the arguments
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
      # image: $image
      # largeImage: $largeImage
    ) {
      # return just the id
      id
    }
  }
`;

class UpdateItem extends Component {
  // to update the item, we don't need an initial state.
  // all values will come in from the form and only some may be changed.
  // this prevents overwriting the state when the item was created.

  state = {}
  
  // using an arrow function makes it an instance function where *this* is bound to the class
  handleChange = (evt) => {
    const { name, type, value } = evt.target;

    // if the type is a number, coerce it to a float
    const val = type === 'number' ? parseFloat(value) : value;

    // brackets here mean that the state of the *name* from evt.target.name will be updated.
    // this is a computed property name
    this.setState({ [name]: val })
  }
  
  updateItem = async (evt, updateItemMutation) => {
    evt.preventDefault();
    console.log('updating item');
    console.log(this.state)
    // the id is not included in the state.
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        // spread the state which updates only the properties required.
        ...this.state
      }
    });
    console.log('updated')
  }

  render() {
    return (
      // we need to first wrap the mutation inside a Query component so that the form has access to the data
      <Query 
        query={SINGLE_ITEM_QUERY} 
        variables={{
        id: this.props.id
      }}>
        {
          ({data, loading}) => {

            if (loading) return <p>Loading...</p>;
            if (!data.item) return <p>No item found for id {this.props.id}</p>

            // the id is now available to the mutation
            return (

            
              /*
                The UPDATE_ITEM_MUTATION exposes the UpdateItem function which is defined in the backend graphql.schema.
                inside the submit handler, it doesn't take in any arguments.
                those are passed to it from the variables prop on the Mutation component.
                those variables are the object collected from this.state.
              */

              <Mutation mutation={UPDATE_ITEM_MUTATION} variables={this.state}>
                {
                  (updateItem, { loading, error }) => (
                    <Form onSubmit={evt => this.updateItem(evt, updateItem)}>
                      <ErrorMessage error={error} />
                      {/* fieldset can take a disabled property which if true 
                      will prevent people from using the form during loading. */}
                      <fieldset disabled={loading} aria-busy={loading}>
                        <label htmlFor="title">
                          Title
                        <input
                          type="text"
                          id="title"
                          name="title"
                          placeholder="Title"
                          // defaultValue allows for displaying info without first putting it into state.
                          defaultValue={data.item.title}
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
                            defaultValue={data.item.price}
                            onChange={this.handleChange}
                            required />
                        </label>
                        <label htmlFor="description">
                          Description
                      <textarea
                            id="description"
                            name="description"
                            placeholder="Enter a description"
                            defaultValue={data.item.description}
                            onChange={this.handleChange}
                            required />
                        </label>
                        <button type="submit">Sav{loading ? 'ing' : 'e'} Changes</button>
                      </fieldset>
                    </Form>
                  )
                }
              </Mutation>
            )
          }
        }
      </Query>
    )
  }
}

export default UpdateItem;
export { UPDATE_ITEM_MUTATION };
