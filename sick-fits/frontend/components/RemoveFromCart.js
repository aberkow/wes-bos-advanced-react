import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const REMOVE_FROM_CART_MUTATION = gql`
 mutation REMOVE_FROM_CART_MUTATION($id: ID!) {
   removeFromCart(id: $id) {
     id
   }
 }
`

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover,
  &:focus {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`

class RemoveFromCart extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  }
  // 
  /**
   * 
   * called as soon as we get a response back from the server
   * after a mutation has been preformed
   * 
   * @param {object} cache - the cache from apollo
   * @param {object} payload - the dump of info returned from the server
   *
   * @memberof RemoveFromCart
   */
  update = (cache, payload) => {
    // 1 - read the cache
    const data = cache.readQuery({ query: CURRENT_USER_QUERY });

    // 2 - remove item from cart
    const cartItemId = payload.data.removeFromCart.id;
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId);

    // 3 - write back to the cache
    cache.writeQuery({ query: CURRENT_USER_QUERY, data });
  }
  render() {
    return (
      <Mutation 
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{id: this.props.id}}
        // using optimisticResponse will immediate remove the item from the view
        // then it will complete the trip to the server using the update function
        optimisticResponse={{
          __typename: 'Mutation',
          removeFromCart: {
            __typename: 'CartItem',
            id: this.props.id
          }
        }}
        update={this.update}>
        {
          (removeFromCart, { loading, error }) => (
            <BigButton 
              title="Delete Item"
              disabled={loading}
              onClick={() => {
                removeFromCart().catch(err => alert(err.message))
              }}>
              &times;
            </BigButton>
          )
        }
      </Mutation>
    )
  }
}

export default RemoveFromCart;