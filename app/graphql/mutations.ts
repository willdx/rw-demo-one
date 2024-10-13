import { gql } from "@apollo/client";

export const PUBLISH_DOCUMENT = gql`
  mutation PublishDocument($id: ID!) {
    updateDocuments(where: { id: $id }, update: { isPublished: true }) {
      info {
        nodesCreated
        nodesDeleted
      }
      documents {
        id
        isPublished
      }
    }
  }
`;

export const UNPUBLISH_DOCUMENT = gql`
  mutation UnpublishDocument($id: ID!) {
    updateDocuments(where: { id: $id }, update: { isPublished: false }) {
      info {
        nodesCreated
        nodesDeleted
      }
      documents {
        id
        isPublished
      }
    }
  }
`;

export const CREATE_SUB_DOCUMENT = gql`
  mutation CreateSubDocument($parentId: ID!, $fileName: String!, $content: String!, $creatorId: ID!) {
    updateDocuments(
      where: { id: $parentId }
      create: {
        children: [
          {
            node: {
              fileName: $fileName
              content: $content
              creator: {
                connect: {
                  where: { node: { id: $creatorId } }
                }
              }
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
