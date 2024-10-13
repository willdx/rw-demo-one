import { gql } from "@apollo/client";

// ... 保留现有的查询

export const GET_DOCUMENT = gql`
  query GetDocument($id: ID!) {
    documents(where: { id: $id }) {
      id
      fileName
      content
      isPublished
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

// 新增获取用户根文档的查询
export const GET_USER_ROOT_DOCUMENT = gql`
  query getUserRootDocument($userId: ID!) {
    documents(
      where: { creator: { id: $userId } }
      options: { sort: { createdAt: DESC }, limit: 1 }
    ) {
      id
      fileName
      content
      creator {
        id
      }
    }
  }
`;

export const GET_DOCUMENTS = gql`
  query Documents(
    $where: DocumentWhere
    $sort: [DocumentChildrenConnectionSort!]
  ) {
    documents(where: $where) {
      id
      fileName
      content
      isPublished
      parent {
        id
      }
      childrenConnection(sort: $sort) {
        edges {
          node {
            id
            fileName
            content
            isPublished
            childrenConnection(sort: $sort) {
              edges {
                node {
                  id
                  fileName
                  content
                  isPublished
                  childrenConnection(sort: $sort) {
                    edges {
                      node {
                        id
                        fileName
                        content
                        isPublished
                      }
                      properties {
                        order
                      }
                    }
                  }
                }
                properties {
                  order
                }
              }
            }
          }
          properties {
            order
          }
        }
      }
    }
  }
`;
