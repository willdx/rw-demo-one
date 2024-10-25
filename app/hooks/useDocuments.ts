import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_PUBLISHED_DOCUMENTS, SEARCH_DOCUMENTS } from "../graphql/queries";
import { Document, DocumentsConnection } from "../types/document";

const LIMIT = 10;

export const useDocuments = (token: string | null) => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: publishedData,
    fetchMore: publishedFetchMore,
    loading: publishedLoading,
  } = useQuery<{
    documentsConnection: DocumentsConnection;
  }>(GET_PUBLISHED_DOCUMENTS, {
    variables: { first: LIMIT, after: null },
    context: { headers: { authorization: token ? `Bearer ${token}` : "" } },
    skip: !token || !!searchTerm,
  });

  const {
    data: searchData,
    fetchMore: searchFetchMore,
    loading: searchLoading,
  } = useQuery<{
    documentsConnection: DocumentsConnection;
  }>(SEARCH_DOCUMENTS, {
    variables: { searchTerm, first: LIMIT, after: null },
    context: { headers: { authorization: token ? `Bearer ${token}` : "" } },
    skip: !token || !searchTerm,
  });

  const currentData = searchTerm ? searchData : publishedData;
  const currentFetchMore = searchTerm ? searchFetchMore : publishedFetchMore;
  const isLoading = searchTerm ? searchLoading : publishedLoading;

  const documents = useMemo(() => {
    return currentData?.documentsConnection.edges.map((edge) => edge.node) || [];
  }, [currentData]);

  const hasNextPage = currentData?.documentsConnection.pageInfo.hasNextPage || false;

  const loadMore = useCallback(() => {
    if (hasNextPage && currentData) {
      currentFetchMore({
        variables: {
          after: currentData.documentsConnection.pageInfo.endCursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            documentsConnection: {
              ...fetchMoreResult.documentsConnection,
              edges: [
                ...prev.documentsConnection.edges,
                ...fetchMoreResult.documentsConnection.edges,
              ],
            },
          };
        },
      });
    }
  }, [currentFetchMore, currentData, hasNextPage]);

  return {
    documents,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasNextPage,
    isLoading,
  };
};
