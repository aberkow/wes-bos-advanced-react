import React from 'react';
import styled from 'styled-components';
import RemoveFromCart from './RemoveFromCart';
import PropTypes from 'prop-types';
import formatMoney from '../lib/formatMoney';

const CartItemStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto;
  img {
    margin-right: 10px;
  }
  h3, p {
    margin: 0;
  }
`

const CartItem = ({ cartItem }) => {
  if (!cartItem.item) {
    return (
      <CartItemStyles>
        <p>This item has been removed from the store.</p>
        <RemoveFromCart id={cartItem.id} />
      </CartItemStyles>
    )
  }
  return (
    <CartItemStyles>
      <img width="100" src={cartItem.item.image} alt={cartItem.item.title}/>
      {cartItem.item.title}
      <div className="cart-item-details">
        <h3>{cartItem.item.title}</h3>
        <p>
          {formatMoney(cartItem.item.price * cartItem.quantity)}
          {' - '}
          <em>
            {cartItem.quantity} &times; {formatMoney(cartItem.item.price)}
          </em>
        </p>
        <p>{cartItem.item.description}</p>
      </div>
      <RemoveFromCart id={cartItem.id} />
    </CartItemStyles>
  )
};

CartItem.prototypes = {
  cartItem: PropTypes.object.isRequired
}

export default CartItem;