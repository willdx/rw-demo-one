import { gql } from "@apollo/client";

export const UPDATE_PUBLISH_DOCUMENT_IS_PUBLISHED = gql`
  mutation UpdateDocumentIsPublished($id: ID!, $isPublished: Boolean!) {
    updateDocuments(where: { id: $id }, update: { isPublished: $isPublished }) {
      documents {
        id
        isPublished
      }
    }
  }
`;

export const CREATE_SUB_DOCUMENT = gql`
  mutation CreateSubDocument(
    $parentId: ID!
    $fileName: String!
    $content: String!
    $creatorId: ID!
  ) {
    updateDocuments(
      where: { id: $parentId }
      create: {
        children: [
          {
            node: {
              fileName: $fileName
              content: $content
              creator: { connect: { where: { node: { id: $creatorId } } } }
            }
            edge: { order: 1000 }
          }
        ]
      }
    ) {
      documents {
        id
        fileName
        content
        isPublished
        creator {
          id
        }
      }
    }
  }
`;

export const DELETE_DOCUMENTS = gql`
  mutation deleteDocuments($where: DocumentWhere) {
    deleteDocuments(where: $where) {
      nodesDeleted
    }
  }
`;

export const DELETE_DOCUMENTS_AND_CHILDREN = gql`
  mutation DeleteDocumentsAndChildren($id: ID!) {
    deleteDocumentsAndChildren(id: $id)
  }
`;

export const CHANGE_DOCUMENT_PARENT = gql`
  mutation ChangeDocumentParent(
    $nodeId: ID!
    $oldParentId: ID!
    $newParentId: ID!
  ) {
    updateDocuments(
      where: { id: $nodeId }
      disconnect: { parent: { where: { node: { id: $oldParentId } } } }
      connect: { parent: { where: { node: { id: $newParentId } } } }
    ) {
      documents {
        id
        fileName
        content
        isPublished
      }
    }
  }
`;
