import React, { Component } from 'react';
import { Query } from 'react-apollo'; // Query is a component that uses a render prop
import gql from 'graphql-tag';
import styled from 'styled-components';

import Item from './Item';
import Pagination from './Pagination';
import { perPage } from '../config';

const ALL_ITEMS_QUERY = gql`
  query ALL_ITEMS_QUERY($skip: Int = 0, $first: Int = ${perPage}) {
    items(first: $first, skip: $skip, orderBy: createdAt_DESC) {
      id
      title
      price
      description
      image
      largeImage
    }
  }
`;

const Center = styled.div`
  text-align: center;
`

const ItemsList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 60px;
  max-width: ${props => props.theme.maxWidth};
  margin: 0 auto;
`

class Items extends Component {
  // the only child of the Query component must be a function
  render() {
    return (
      <Center>
        <Pagination page={this.props.page} />
          <Query 
            query={ALL_ITEMS_QUERY}
            // the fetchPolicy helps invalidate the cache when items are added or deleted
            // but using network only forces a roundtrip to the server constantly
            // fetchPolicy='network-only' 
            variables={{
            skip: this.props.page * perPage - perPage
          }}>
            {
              ({ data, error, loading }) => {
                if (loading) return <p>Loading...</p>
                if (error) return <p>Error: {error.message}</p>
                // return a list of items
                return (
                  <ItemsList>
                    { 
                      // iterate over each item
                      data.items.map(item => {
                        return <Item key={item.id} item={item} />
                      })
                    }
                  </ItemsList>
                )
              }
            }
          </Query>
        <Pagination page={this.props.page} />
      </Center>
    )
  }
}

export default Items;
export { ALL_ITEMS_QUERY };
