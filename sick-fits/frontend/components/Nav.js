import { Fragment } from 'react';
import { Mutation } from 'react-apollo';
import Link from 'next/link';
import NavStyles from './styles/NavStyles';
import { TOGGLE_CART_MUTATION } from './Cart';

import Signout from './Signout';
import User from './User';

const Nav = () => (
  <User>
    {({ data: { me } }) => (
      <NavStyles>
        <Link href="/shop">
          <a>shop</a>
        </Link>
        {me && (
          <Fragment>
            <Link href="/sell">
              <a>sell</a>
            </Link>
            <Link href="/orders">
              <a>orders</a>
            </Link>
            <Link href="/me">
              <a>account</a>
            </Link>
            <Signout />
            <Mutation mutation={TOGGLE_CART_MUTATION}>
              {
                (toggleCart) => (
                  <button onClick={toggleCart}>My Cart</button>
                )
              }
            </Mutation>
          </Fragment>
        )}
        {!me && (
          <Link href="/signup">
            <a>sign in</a>
          </Link>
        )}

      </NavStyles>
    )}
  </User>
)

export default Nav;