import { gql } from "@apollo/client";

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
  mutation UpdateDocument(
    $where: DocumentWhere!
    $update: DocumentUpdateInput!
  ) {
    updateDocuments(where: $where, update: $update) {
      documents {
        id
        fileName
        content
      }
    }
  }
`;

// 获取已发布文档的查询
export const GET_PUBLISHED_DOCUMENTS = gql`
  query getPublishedDocuments($first: Int, $after: String) {
    documentsConnection(
      where: { isPublished: true }
      sort: [{ updatedAt: DESC }]
      first: $first
      after: $after
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          fileName
          content
          creator {
            id
          }
        }
      }
    }
  }
`;

// 搜索文档的查询
export const SEARCH_DOCUMENTS = gql`
  query searchDocuments($searchTerm: String!, $first: Int, $after: String) {
    documentsConnection(
      where: { isPublished: true, content_CONTAINS: $searchTerm }
      sort: [{ updatedAt: DESC }]
      first: $first
      after: $after
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          fileName
          content
          creator {
            id
          }
        }
      }
    }
  }
`;
