import React, { Component } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0) 
}

class TakeMyMoney extends Component {
  onToken = (res) => {
    // the response from stripe contains a whole bunch of info about the credit card
    // the number etc is hashed though.
    console.log(res, 'onToken called')
  }
  render() {
    return (
      <User>
        {
          ({ data: { me } }) => (
            <StripeCheckout
              amount={calcTotalPrice(me.cart)}
              name="Sick Fits"
              description={`Order of ${totalItems(me.cart)} items.`}
              image={me.cart[0].item && me.cart[0].item.image}
              stripeKey="pk_test_aL9QOnRJ6fSCrmLqZHS31u91"
              currency="USD"
              email={me.email}
              token={res => this.onToken(res)}>
              {this.props.children}
            </StripeCheckout>
          )
        }
      </User>
    )
  }
}

export default TakeMyMoney
