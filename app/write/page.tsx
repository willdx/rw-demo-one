"use client";

import { useState, useEffect } from "react";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "/api/graphql",
  cache: new InMemoryCache(),
});

const GET_DOCUMENTS = gql`
  query Documents(
    $where: DocumentWhere
    $sort: [DocumentChildrenConnectionSort!]
  ) {
    documents(where: $where) {
      id
      fileName
      childrenConnection(sort: $sort) {
        edges {
          node {
            id
            fileName
            content
          }
          properties {
            order
          }
        }
      }
    }
  }
`;

export default function WritePage() {
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await client.query({
        query: GET_DOCUMENTS,
        variables: {
          where: {
            id: "c0477945-c54b-4c65-8980-be8dd144d277",
          },
          sort: [
            {
              edge: {
                order: "ASC",
              },
              node: {
                updatedAt: "DESC",
              },
            },
          ],
        },
      });
      setDocuments(data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const renderDocumentTree = (document: any) => (
    <ul key={document.id}>
      <li>
        {document.fileName}
        {document.childrenConnection?.edges.map((edge: any) =>
          renderDocumentTree(edge.node)
        )}
      </li>
    </ul>
  );

  return (
    <div className="grid grid-cols-1 h-screen w-full md:grid-cols-2">
      <div className="bg-blue-200 overflow-auto">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Document Structure</h2>
          {documents.map(renderDocumentTree)}
        </div>
      </div>
      <div className="bg-green-200">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Right Column</h2>
          <p>This is the content for the right column.</p>
        </div>
      </div>
    </div>
  );
}
