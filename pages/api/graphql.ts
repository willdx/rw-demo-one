import { ApolloServer } from "@apollo/server";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { OGM } from "@neo4j/graphql-ogm";
import neo4j from "neo4j-driver";
import { gql } from "graphql-tag";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import fs from "fs";
import path from "path";
import { printSchema } from "graphql";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "@apollo/server-plugin-landing-page-graphql-playground";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const typeDefs = gql`
  type User {
    id: ID! @id
    username: String!
    email: String! @unique
    password: String! @private
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    roles: [Role!]! @relationship(type: "HAS_ROLE", direction: OUT)
    documents: [Document!]! @relationship(type: "CREATED", direction: OUT)
  }

  extend type User @authentication

  enum RoleName {
    USER
    ADMIN
  }

  type Role {
    id: ID! @id
    name: RoleName! @unique
    users: [User!]! @relationship(type: "HAS_ROLE", direction: IN)
  }

  extend type Role @authentication

  type Document {
    id: ID! @id
    fileName: String!
    content: String!
    fileSize: Int @default(value: 0)
    fileSource: String @default(value: "local file")
    fileType: String @default(value: "md")
    is_cancelled: Boolean @default(value: false)
    model: String @default(value: "通义千问")
    nodeCount: Int @default(value: 0)
    processed_chunk: Int @default(value: 0)
    processingTime: Int @default(value: 0)
    relationshipCount: Int @default(value: 0)
    status: String @default(value: "New")
    total_chunks: Int @default(value: 0)
    total_pages: Int @default(value: 1)
    errorMessage: String
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    deletedAt: DateTime
    isPublished: Boolean! @default(value: false)
    children: [Document!]!
      @relationship(type: "HAS_CHILD", direction: OUT, properties: "ChildOrder")
    parent: Document @relationship(type: "HAS_CHILD", direction: IN)
    creator: User! @relationship(type: "CREATED", direction: IN)
  }

  type JWT @jwt {
    sub: ID!
    rootId: ID!
    roles: [String!]!
  }

  extend type Document
    @authentication(
      operations: [
        CREATE
        UPDATE
        DELETE
        CREATE_RELATIONSHIP
        DELETE_RELATIONSHIP
      ]
    )
    @authorization(
      validate: [
        {
          operations: [
            CREATE
            UPDATE
            DELETE
            CREATE_RELATIONSHIP
            DELETE_RELATIONSHIP
          ]
          where: { node: { creator: { id: "$jwt.sub" } } }
        }
        {
          operations: [
            CREATE
            UPDATE
            DELETE
            CREATE_RELATIONSHIP
            DELETE_RELATIONSHIP
          ]
          where: { jwt: { roles_INCLUDES: "admin" } }
        }
      ]
    )
    @authorization(
      filter: [
        {
          operations: [READ, AGGREGATE]
          requireAuthentication: false
          where: { node: { isPublished: true } }
        }
        { where: { node: { creator: { id: "$jwt.sub" } } } }
        { where: { jwt: { roles_INCLUDES: "admin" } } }
      ]
    )

  type ChildOrder @relationshipProperties {
    order: Float
  }

  type Mutation {
    signUp(email: String!, password: String!, username: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    createInitialRoles: Boolean!
    deleteDocumentsAndChildren(id: ID!): Boolean!
    generateKnowledgeGraph(documentId: ID!): KnowledgeGraphResult!
    aiChat(message: String!): AiChatResponse!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type KnowledgeGraphResult {
    success: Boolean!
    message: String
  }

  type AiChatResponse {
    status: String!
    data: AiChatData!
  }

  type AiChatData {
    session_id: String!
    message: String!
    info: AiChatInfo!
    user: String!
  }

  type AiChatInfo {
    sources: [String!]!
    model: String!
    chunkdetails: [ChunkDetail!]!
    total_tokens: Int!
    response_time: Float!
    mode: String!
  }

  type ChunkDetail {
    id: String!
    score: Float!
  }

  type Query {
    searchDocuments(
      searchTerm: String!
      page: Int = 1
      limit: Int = 10
    ): DocumentSearchResult!
  }

  type DocumentSearchResult {
    documents: [Document!]!
    totalCount: Int!
  }
`;

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

const ogm = new OGM({ typeDefs, driver });
const User = ogm.model("User");
const Role = ogm.model("Role");
const Document = ogm.model("Document");

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  features: {
    authorization: {
      key: process.env.JWT_SECRET || "",
    },
  },
  driver,
  resolvers: {
    Query: {
      searchDocuments: async (
        _source,
        { searchTerm, page, limit },
        { driver, jwt }
      ) => {
        console.log("searchTerm:", searchTerm, page, limit);
        const session = driver.session();
        try {
          const skip = (page - 1) * limit;
          const cypherSearch = `
            CALL db.index.fulltext.queryNodes('documentsContentIndex', $searchTerm)
            YIELD node, score
            WHERE node:Document
            AND (node.isPublished = true OR $userId IS NOT NULL AND node.creator.id = $userId OR $isAdmin = true)
            WITH node, score
            ORDER BY score DESC
            SKIP $skip
            LIMIT $limit
            RETURN collect(node) as documents, count(node) as totalCount
          `;

          console.log("Cypher query:", cypherSearch);
          const searchParams = {
            searchTerm,
            skip: neo4j.int(skip),
            limit: neo4j.int(limit),
            userId: jwt ? jwt.sub : null,
            isAdmin: jwt ? jwt.roles.includes("ADMIN") : false,
          };
          console.log("Search params:", searchParams);
          const result = await session.run(cypherSearch, searchParams);

          const documents = result.records[0].get("documents");
          const totalCount = result.records[0].get("totalCount");

          return {
            documents: documents.map((doc: any) => doc.properties),
            totalCount: totalCount.low,
          };
        } finally {
          await session.close();
        }
      },
    },
    Mutation: {
      signUp: async (_source, { username, email, password }) => {
        const [existing] = await User.find({
          where: { email },
        });

        if (existing) {
          throw new Error(`邮箱已存在`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 查找普通用户角色
        const [userRole] = await Role.find({
          where: { name: "USER" },
        });

        if (!userRole) {
          throw new Error(`未找到普通用户角色，请先创建角色`);
        }

        const { users } = await User.create({
          input: [
            {
              username,
              email,
              password: hashedPassword,
              roles: {
                connect: [{ where: { node: { id: userRole.id } } }],
              },
            },
          ],
        });

        const newUser = users[0];

        // 创建用户根文档
        const { documents } = await Document.create({
          input: [
            {
              fileName: newUser.username || "me",
              content: `# 欢迎使用我们的系统！\n\n 
              请在这里开始你的知识记录吧！\n\n 你可以使用 Markdown 语法来记录你的知识。\n\n
              你可以点击左侧的节点右键弹出右键菜单来控制子节点`,
              isPublished: false,
              creator: {
                connect: { where: { node: { id: newUser.id } } },
              },
            },
          ],
        });

        const rootDocument = documents[0];

        const token = generateJwtToken(newUser, rootDocument.id);

        return {
          token,
          user: newUser,
        };
      },

      signIn: async (_source, { email, password }) => {
        const [user] = await User.find({
          where: { email },
          selectionSet: `{
            id
            username
            email
            password
            roles {
              id
              name
            }
          }`,
        });

        if (!user) {
          throw new Error(`用户不存在`);
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
          throw new Error(`密码错误`);
        }

        // 获取用户根文档
        const [rootDocument] = await Document.find({
          where: { creator: { id: user.id } },
          options: { sort: [{ createdAt: "ASC" }], limit: 1 },
        });

        const rootId = rootDocument?.id || null;

        const token = generateJwtToken(user, rootId);

        return {
          token,
          user,
        };
      },

      createInitialRoles: async () => {
        const existingRoles = await Role.find();
        if (existingRoles.length > 0) {
          return false; // 角色已存在，不要创建
        }

        await Role.create({
          input: [{ name: "USER" }, { name: "ADMIN" }],
        });

        return true;
      },

      deleteDocumentsAndChildren: async (_, { id }, context) => {
        const session = context.driver.session();
        try {
          await session.run(
            `
            MATCH (d:Document {id: $id})
            CALL {
              WITH d
              MATCH (d)-[:HAS_CHILD*0..]->(child:Document)
              DETACH DELETE child
            }
            `,
            { id }
          );
          return true;
        } catch (error) {
          console.error("删除文档及其子节点时出错:", error);
          return false;
        } finally {
          await session.close();
        }
      },

      generateKnowledgeGraph: async (_, { documentId }) => {
        try {
          const documents = await Document.find({
            where: { id: documentId },
            options: { limit: 1 },
            selectionSet: "{ id }",
          });

          if (documents.length === 0) {
            return { success: false, message: "未找到指定文档" };
          }
          const formData = new FormData();
          formData.append("uri", process.env.NEO4J_URI || "");
          formData.append("userName", process.env.NEO4J_USERNAME || "");
          formData.append("password", process.env.NEO4J_PASSWORD || "");
          formData.append("database", process.env.NEO4J_DATEBASE || "");
          formData.append("port", process.env.NEO4J_PORT || "");
          formData.append("model", "通义千问");
          formData.append("source_type", "db_content");
          formData.append(
            "allowedNodes",
            "Document,Application,DataCenter,Egress,Interface,Machine,Network,OS,Port,Process,Rack,Router,Service,Software,Switch,Type,Version,Zone"
          );
          formData.append(
            "allowedRelationship",
            "CONNECTS,CONTAINS,DEPENDS_ON,EXPOSES,HOLDS,INSTANCE,LISTENS,PREVIOUS,ROUTES,RUNS,TYPE,VERSION"
          );
          formData.append("unique_id", documentId);

          await axios.post("http://localhost:8000/extract", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          return { success: true, message: "知识图谱生成成功" };
        } catch (error) {
          console.error("生成知识图谱时出错:", error);
          return { success: false, message: "生成知识图谱失败，请稍后重试" };
        }
      },

      aiChat: async (_source, { message }, context) => {
        if (!context.currentUser) {
          throw new Error("您必须登录才能使用此功能");
        }

        try {
          const formData = new FormData();
          formData.append("uri", process.env.NEO4J_URI || "");
          formData.append("userName", process.env.NEO4J_USERNAME || "");
          formData.append("password", process.env.NEO4J_PASSWORD || "");
          formData.append("database", process.env.NEO4J_DATEBASE || "");
          formData.append("model", "通义千问");
          formData.append("mode", "graph+vector");
          formData.append("question", message);
          formData.append("session_id", "1c7797f2-2490-4be0-a44d-f27224a6726e");
          formData.append("document_names", "[]");
          console.log("AI 聊天请求:", formData);

          const response = await axios.post(
            "http://localhost:8000/chat_bot",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          console.log("AI 聊天响应:", response.data);
          return response.data; // 直接返回整个响应数据
        } catch (error) {
          console.error("AI 聊天错误:", error);
          throw new Error("法处理您的请求，请稍后再试");
        }
      },
    },
  },
});

const createApolloServer = async () => {
  await ogm.init();
  const schema = await neoSchema.getSchema();

  // 将 schema 存储到本地文件
  const schemaString = printSchema(schema);
  const filePath = path.join(process.cwd(), "generated-schema.graphql");
  fs.writeFileSync(filePath, schemaString);
  console.log(`Schema has been written to ${filePath}`);

  return new ApolloServer({
    schema,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
};

export default startServerAndCreateNextHandler(await createApolloServer(), {
  context: async (req: NextApiRequest, res: NextApiResponse) => {
    // 解析 JWT Token 并将用户信息传入 context
    const token = req.headers.authorization || "";
    let currentUser = null;
    let decodedToken = null;

    if (token) {
      try {
        // 解码 JWT Token 获取用户信息
        decodedToken = jwt.verify(
          token.replace("Bearer ", ""),
          process.env.JWT_SECRET!
        ) as { sub: string; root_id: string | null };
        const [user] = await User.find({ where: { id: decodedToken.sub } });
        currentUser = user;
      } catch (err) {
        console.error("无效或过期的令牌", err);
      }
    }
    // console.log("当前用户:", currentUser);
    // console.log("token:", token);
    // console.log("jwt:", decodedToken);
    return {
      req,
      res,
      currentUser,
      token,
      jwt: decodedToken,
      driver, // 添加这一行，确保 driver 被传到 context 中
    };
  },
});
function generateJwtToken(user: any, rootId: any) {
  return jwt.sign(
    {
      sub: user.id,
      rootId: rootId,
      roles: user.roles.map((role) => role.name),
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d",
    }
  );
}
