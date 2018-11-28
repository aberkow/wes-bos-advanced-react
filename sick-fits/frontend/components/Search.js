import React, { Component } from 'react';
import Downshift from 'downshift';
import Router from 'next/router';
import { ApolloConsumer } from 'react-apollo';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';

const SEARCH_ITEMS_QUERY = gql`
  query SEARCH_ITEMS_QUERY($searchTerm: String!) {
    items(where: {
      # find the search term in the title or description
      OR: [
        { title_contains: $searchTerm },
        { description_contains: $searchTerm }
      ]
    }) {
      id
      title
      image
    }
  }
`

class AutoComplete extends Component {
  state = {
    items: [],
    loading: false
  }
  // use debounce to make sure that the backend isn't hit on every keydown
  onChange = debounce(async (evt, client) => {
    // turn on loading
    this.setState({ loading: true });
    // manually query the apollo client
    const response = await client.query({
      query: SEARCH_ITEMS_QUERY,
      variables: { searchTerm: evt.target.value }
    })
    this.setState({
      items: response.data.items,
      loading: false
    })
  }, 350)
  render() {
    return (
      <SearchStyles>
        <div>
          {/* 
            ApolloConsumer allows for making queries on the Apollo Client and not on page load.
            for search, the pattern <Query>{() => <input />}</Query> won't work
          */}
          <ApolloConsumer>
            {
              (client) => (
                <input type="search" onChange={(evt) => {
                  evt.persist();
                  this.onChange(evt, client);
                }} />
              )
            }
          </ApolloConsumer>
          <DropDown>
            {
              this.state.items.map(item => {
                return (
                  <DropDownItem key={item.id}>
                    <img width="50" src={item.image} alt={item.title} />
                  </DropDownItem>
                )
              })
            }
          </DropDown>
        </div>
      </SearchStyles>
    )

  }
}

export default AutoComplete;