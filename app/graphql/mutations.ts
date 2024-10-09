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
