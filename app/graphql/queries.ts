import { gql } from '@apollo/client';

// ... 保留现有的查询

export const GET_DOCUMENT = gql`
  query GetDocument($id: ID!) {
    documents(where: { id: $id }) {
      id
      fileName
      content
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($where: DocumentWhere!, $update: DocumentUpdateInput!) {
    updateDocuments(where: $where, update: $update) {
      documents {
        id
        fileName
        content
      }
    }
  }
`;