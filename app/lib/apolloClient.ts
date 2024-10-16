import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "/api/graphql", // 确保这是正确的 GraphQL endpoint
});

const authLink = setContext((_, { headers }) => {
  // 从 localStorage 获取 token
  const token = localStorage.getItem("token");
  // 返回 headers 给 context，以便 httpLink 可以读取
  console.log("#token:", token);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

export default client;
