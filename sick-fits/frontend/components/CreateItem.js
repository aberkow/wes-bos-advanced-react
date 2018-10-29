import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';
import ErrorMessage from './ErrorMessage';

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
  

  uploadFile = async (evt) => {

    // might be nice to prevent form submission while the image is being uploaded.
    // just in case it hasn't finished by the time people are done filling out the form

    const files = evt.target.files;
    const data = new FormData();
    data.append('file', files[0]);
    data.append('upload_preset', 'sickfits');

    const res = await fetch('https://api.cloudinary.com/v1_1/dpubonry5/image/upload', {
      method: 'POST',
      body: data
    })

    const file = await res.json();
    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url
    });
  }

  render() {
    return (
      
      /*
        The CREATE_ITEM_MUTATION exposes the createItem function which is defined in the backend graphql.schema.
        inside the submit handler, it doesn't take in any arguments.
        those are passed to it from the variables prop on the Mutation component.
        those variables are the object collected from this.state.
      */

      <Mutation 
        mutation={CREATE_ITEM_MUTATION} 
        variables={this.state}>
        {
          (createItem, { loading, error }) => (
            <Form onSubmit={ async (evt) => {
              // prevent the page from reloading
              evt.preventDefault();
              // createItem exposed via CREATE_ITEM_MUTATION
              const res = await createItem();

              // go to the single item page for the item that was created.
              Router.push({
                pathname: '/item',
                query: { id: res.data.createItem.id }
              })
            }}>
              <ErrorMessage error={error} />
              {/* fieldset can take a disabled property which if true 
              will prevent people from using the form during loading. */}
              <fieldset disabled={loading} aria-busy={loading}>
                <label htmlFor="file">
                  Image
                <input
                  type="file"
                  id="file"
                  name="file"
                  placeholder="Upload an Image"
                  onChange={this.uploadFile}
                  required />
                  {
                    // show a preview image on upload
                    this.state.image && <img width="200" src={this.state.image} alt="upload preview" />
                  }
                </label>
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
