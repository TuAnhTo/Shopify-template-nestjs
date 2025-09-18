export const GET_CUSTOMERS = `
  query getCustomers($first: Int!) {
    customers(first: $first) {
      nodes {
        id
        displayName
        email
        firstName
        lastName
        phone
        totalSpentV2 {
          amount
          currencyCode
        }
        ordersCount {
          count
        }
        state
        tags
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_CUSTOMER_BY_ID = `
  query getCustomer($id: ID!) {
    customer(id: $id) {
      id
      displayName
      email
      firstName
      lastName
      phone
      totalSpentV2 {
        amount
        currencyCode
      }
      ordersCount {
        count
      }
      state
      tags
      createdAt
      updatedAt
    }
  }
`;
