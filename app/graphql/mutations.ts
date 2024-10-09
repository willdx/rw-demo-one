import { gql } from "@apollo/client";

export const PUBLISH_DOCUMENT = gql`
  mutation PublishDocument($id: ID!, $isPublished: Boolean!) {
    updateDocuments(where: { id: $id }, update: { isPublished: $isPublished }) {
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
