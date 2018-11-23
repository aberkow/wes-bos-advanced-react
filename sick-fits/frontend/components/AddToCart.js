import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const ADD_TO_CART_MUTATION = gql`
  mutation ADD_TO_CART_MUTATION($id: ID!) {
    addToCart(id: $id) {
      id
      quantity
      # item {
      #   title
      #   image
      #   description
      # }
    }
  }
`

class AddToCart extends Component {
  // update = (cache, payload) => {
  //   console.log('add to cart update');
  //   const data = cache.readQuery({ query: CURRENT_USER_QUERY });
  //   const cartItem = payload.data.addToCart.item;
  //   data.me.cart.push(cartItem);
  //   cache.writeQuery({ query: CURRENT_USER_QUERY, data })
  //   console.log(data.me.cart, 'cart');
  // }
  render() {
    const { id } = this.props;
    return (
      <Mutation 
        mutation={ADD_TO_CART_MUTATION}
        variables={{id}}
        // when someone adds something to the cart, 
        // automatically refetch the items so the cart updates automatically
        refetchQueries={[ { query: CURRENT_USER_QUERY } ]}
        // update={this.update}
        // // this doesn't quite work yet.
        // optimisticResponse={{
        //   __typename: 'Mutation',
        //   addToCart: {
        //     __typename: 'CartItem',
        //     id: this.props.id,
        //     quantity: this.props.quantity,
        //   }
        // }}
      >
        {
          (addToCart, { loading }) => (
            <button disabled={loading} onClick={addToCart}>
              Add{loading ? 'ing' : ''} to Cart
            </button>
          )
        }
      </Mutation>
    )
  }
}

export default AddToCart;
