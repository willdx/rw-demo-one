export interface Document {
  id: string;
  fileName: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  creator: {
    id: string;
    username: string;
  };
}

export interface DocumentEdge {
  node: Document;
}

export interface DocumentsConnection {
  edges: DocumentEdge[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}
