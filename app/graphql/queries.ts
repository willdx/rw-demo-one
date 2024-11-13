import { gql } from "@apollo/client";

export const GET_DOCUMENT = gql`
  query GetDocument($id: ID!) {
    documents(where: { id: $id }) {
      id
      fileName
      content
      status
      isPublished
    }
  }
`;

export const UPDATE_DOCUMENT_CONTENT = gql`
  mutation UpdateDocumentContent(
    $where: DocumentWhere!
    $update: DocumentUpdateInput!
  ) {
    updateDocuments(where: $where, update: $update) {
      documents {
        id
        fileName
        content
        status
        isPublished
      }
    }
  }
`;

// 获取已发布文档的查询
export const GET_PUBLISHED_DOCUMENTS = gql`
  query getPublishedDocuments($first: Int, $after: String) {
    documentsConnection(
      where: { publishedAt_GT: "1970-01-01T00:00:00.000Z" }
      sort: [{ publishedAt: DESC }]
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          fileName
          content
          isPublished
          publishedAt
          creator {
            id
            username
          }
        }
      }
    }
  }
`;

// 搜索文档的查询
export const SEARCH_DOCUMENTS = gql`
  query searchDocuments(
    $searchTerm: String!
    $first: Int
    $after: String
    $creatorId: ID
  ) {
    documentsConnection(
      where: { content_CONTAINS: $searchTerm, creator: { id: $creatorId } }
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
          updatedAt
          status
          isPublished
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
      status
      isPublished
      creator {
        id
      }
    }
  }
`;

const generateChildrenConnection = (depth: number): string => {
  if (depth <= 0) return "";

  return `
    childrenConnection(where: $childrenWhere, sort: $sort) {
      edges {
        node {
          ...DocumentFields
          ${depth > 1 ? generateChildrenConnection(depth - 1) : ""}
        }
        properties {
          order
        }
      }
    }
  `;
};

export const createGetDocumentsQuery = (maxDepth: number) => gql`
  fragment DocumentFields on Document {
    id
    fileName
    content
    status
    isPublished
    parent {
      id
    }
  }

  query Documents(
    $where: DocumentWhere
    $sort: [DocumentChildrenConnectionSort!]
    $childrenWhere: DocumentChildrenConnectionWhere
  ) {
    documents(where: $where) {
      ...DocumentFields
      ${generateChildrenConnection(maxDepth - 1)}
    }
  }
`;

// 添加新的查询用于搜索可复用节点
export const SEARCH_REUSABLE_DOCUMENTS = gql`
  query searchReusableDocuments(
    $searchTerm: String!
    $page: Int!
    $limit: Int!
  ) {
    searchReusableDocuments(
      searchTerm: $searchTerm
      page: $page
      limit: $limit
    ) {
      documents {
        id
        fileName
        content
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_NODE_REFERENCES = gql`
  query getNodeReferences($nodeId: ID!, $page: Int!, $limit: Int!) {
    getNodeReferences(nodeId: $nodeId, page: $page, limit: $limit) {
      references {
        id
        fileName
        content
        updatedAt
      }
      totalCount
    }
  }
`;

export const GET_NODE_PARENTS = gql`
  query GetNodeParents($nodeId: ID!, $page: Int!, $limit: Int!) {
    getNodeParents(nodeId: $nodeId, page: $page, limit: $limit) {
      parents {
        id
        fileName
        content
        updatedAt
        isPublished
      }
      totalCount
    }
  }
`;
