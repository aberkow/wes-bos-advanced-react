import React, { Component } from 'react';
import Downshift, { resetIdCounter } from 'downshift';
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

// go the the single page of an item when it's selected.
function routeToItem(item) {
  Router.push({
    pathname: '/item',
    query: {
      id: item.id
    }
  })
}

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
    resetIdCounter()
    return (
      <SearchStyles>
        {/* 
          By default downshift turns the results into strings.
          that initally makes the item return [object Object]
          so you need to use the title property of the item
        */}
        <Downshift
          onChange={routeToItem} 
          itemToString={item => (item === null ? '' : item.title)}>
          {
            ({ getInputProps, getItemProps, isOpen, inputValue, highlightedIndex }) => (

            <div>
              {/* 
                ApolloConsumer allows for making queries on the Apollo Client and not on page load.
                for search, the pattern <Query>{() => <input />}</Query> won't work
              */}
              <ApolloConsumer>
                {
                  (client) => (
                    <input 
                      {...getInputProps({
                          type: "search",
                          placeholder: 'Search for an item',
                          id: 'search',
                          className: this.state.loading ? 'loading' : '',
                          onChange: (evt) => {
                            evt.persist();
                            this.onChange(evt, client);
                          } 
                        })
                      } />
                  )
                }
              </ApolloConsumer>
              {/* 
                isOpen manages if the dropdown should be visible or not
              */}
              { isOpen && (
                <DropDown>
                  {
                    this.state.items.map((item, index) => {
                      return (
                        <DropDownItem 
                          {...getItemProps({ item }) }
                          // highlighted prop is used in the styles
                          highlighted={index === highlightedIndex}
                          key={item.id}>
                          <img width="50" src={item.image} alt={item.title} />
                          {item.title}
                        </DropDownItem>
                      )
                    })
                  }
                </DropDown>
              )}
              {!this.state.items.length && !this.state.loading && (
                <DropDownItem>Nothing found for {inputValue}</DropDownItem>
              )}
            </div>
            )
          }
        </Downshift>
      </SearchStyles>
    )

  }
}

export default AutoComplete;