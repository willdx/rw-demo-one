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

// 在文件开头添加类型定义
interface JwtPayload {
  sub: string;
  rootId: string | null;
  roles: string[];
  iat?: number;
  exp?: number;
}

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
    publishedAt: DateTime
    deletedAt: DateTime
    isPublished: Boolean! @default(value: false)
    children: [Document!]!
      @relationship(type: "HAS_CHILD", direction: OUT, properties: "ChildOrder")
    parents: [Document!]! @relationship(type: "HAS_CHILD", direction: IN)
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
      filter: [
        { where: { node: { creator: { id: "$jwt.sub" } } } }
        { where: { jwt: { roles_INCLUDES: "admin" } } }
      ]
    )

  type ChildOrder @relationshipProperties {
    order: Float
  }

  type ChangeParentResult {
    success: Boolean!
    message: String!
  }

  type Mutation {
    signUp(email: String!, password: String!, username: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    createInitialRoles: Boolean!
    deleteDocumentsAndChildren(id: ID!): Boolean!
    generateKnowledgeGraph(documentId: ID!): KnowledgeGraphResult!
    aiChat(message: String!): AiChatResponse!
    changeDocumentParent(
      nodeId: ID!
      oldParentIds: [ID!]
      newParentId: ID
    ): ChangeParentResult!
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
    searchReusableDocuments(
      searchTerm: String!
      page: Int = 1
      limit: Int = 10
    ): DocumentSearchResult!
    getNodeReferences(
      nodeId: ID!
      page: Int!
      limit: Int!
    ): NodeReferencesResult!
    getNodeParents(nodeId: ID!, page: Int!, limit: Int!): NodeParentsResult!
  }

  type DocumentSearchResult {
    documents: [Document!]!
    totalCount: Int!
  }

  type NodeReferencesResult {
    references: [Document!]!
    totalCount: Int!
  }

  type NodeParentsResult {
    parents: [Document!]!
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
      searchReusableDocuments: async (
        _source,
        { searchTerm, page, limit },
        { driver, jwt }
      ) => {
        console.log("searchTerm:", searchTerm, page, limit);
        const session = driver.session();
        try {
          const skip = (page - 1) * limit;
          // 目前仅支持搜索自己的文档
          // 定义cards节点下的节点就是可重用的节点，暂时不使用重用卡片字段标记节点是否可重用
          const cypherSearch = `
            CALL db.index.fulltext.queryNodes('documentsContentIndex', $searchTerm)
            YIELD node, score
            MATCH (creator:User)-[:CREATED]->(node:Document)
            MATCH (root:Document)-[:HAS_CHILD*]->(cards:Document {fileName: "cards"})
            MATCH (cards)-[:HAS_CHILD*]->(node)
            WHERE creator.id = $userId
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
      getNodeReferences: async (
        _source,
        { nodeId, page, limit },
        { driver }
      ) => {
        const session = driver.session();
        try {
          const skip = (page - 1) * limit;
          const cypherQuery = `
            MATCH (current:Document {id: $nodeId})-[:HAS_CHILD]->(child:Document)
            MATCH (root:Document)-[:HAS_CHILD*]->(cards:Document {fileName: "cards"})-[:HAS_CHILD*]->(child)
            WITH child
            SKIP $skip
            LIMIT $limit
            RETURN collect(child) as references, count(child) as totalCount
          `;

          const result = await session.run(cypherQuery, {
            nodeId,
            skip: neo4j.int(skip),
            limit: neo4j.int(limit),
          });

          return {
            references: result.records[0]
              .get("references")
              .map((ref: any) => ref.properties),
            totalCount: result.records[0].get("totalCount").low,
          };
        } finally {
          await session.close();
        }
      },
      getNodeParents: async (_source, { nodeId, page, limit }, { driver }) => {
        const session = driver.session();
        try {
          const skip = (page - 1) * limit;
          const result = await session.run(
            `
            MATCH (node:Document {id: $nodeId})<-[r:HAS_CHILD]-(parent:Document)
            WITH parent
            ORDER BY parent.fileName ASC, parent.updatedAt DESC
            WITH collect(parent) as parents, count(parent) as total
            RETURN parents[${skip}..${skip + limit}] as parents, total
            `,
            { nodeId }
          );

          const parents = result.records[0].get("parents") || [];
          const totalCount = result.records[0].get("total").low;

          return {
            parents: parents.map((parent: any) => parent.properties),
            totalCount,
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

        const { documents } = await Document.create({
          input: [
            {
              fileName: newUser.username || "me",
              content: `\# 欢迎使用读写

我们使用思维导图来管理知识的结构，使用markdown语法来编辑内容。

在开始使用读写之前，请先阅读以下共识：

1.笔记不是记录一次就不管了，需要反复修改。

2.笔记写的不是越细越好，而是越简单越好。

3.我们不做分类, 实体识别能很好的做这件事，交给大模型去做。

## 使用方式

我们默认创建两个子节点一个是projects（用来管理项目笔记），一个是cards（用于存储积累下来的相对成熟的卡片笔记）。在推进项目的过程中抽象可复用的知识卡片，知识卡片的复用又加快项目的进程，促进知识的正循环。

我们可以在项目笔记中将任意一个节点转为复用卡片，也可以直接在cards中创建复用卡片。我们建议一个节点，只做一件事情，方便复用。
              `,
              isPublished: false,
              creator: {
                connect: { where: { node: { id: newUser.id } } },
              },
              children: {
                create: [
                  {
                    edge: {
                      order: 1000,
                    },
                    node: {
                      fileName: "projects",
                      content:
                        "# 使用立项的方式来管理笔记， 重行动，轻分类\n\n请点击projects节点->右键->添加子节点,创建新的项目",
                      isPublished: false,
                      creator: {
                        connect: { where: { node: { id: newUser.id } } },
                      },
                    },
                  },
                  {
                    edge: {
                      order: 1000,
                    },
                    node: {
                      fileName: "cards",
                      content:
                        "# 这里是可重用的卡片\n\n请点击cards节点->右键->添加子节点,创建新的可重用的知识卡片",
                      isPublished: false,
                      creator: {
                        connect: { where: { node: { id: newUser.id } } },
                      },
                    },
                  },
                ],
              },
            },
          ],
        });

        const rootDocument = documents[0];
        const token = generateJwtToken(newUser, rootDocument.id, [userRole]);

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
          formData.append("database", process.env.NEO4J_DATABASE || "");
          formData.append("port", process.env.NEO4J_PORT || "");
          formData.append("model", "通义千问");
          formData.append("source_type", "db_content");
          // formData.append(
          //   "allowedNodes",
          //   "Document,Application,DataCenter,Egress,Interface,Machine,Network,OS,Port,Process,Rack,Router,Service,Software,Switch,Type,Version,Zone"
          // );
          // formData.append(
          //   "allowedRelationship",
          //   "CONNECTS,CONTAINS,DEPENDS_ON,EXPOSES,HOLDS,INSTANCE,LISTENS,PREVIOUS,ROUTES,RUNS,TYPE,VERSION"
          // );
          formData.append("allowedNodes", ""); // 区别2
          formData.append("allowedRelationship", ""); // 区别3
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
          formData.append("database", process.env.NEO4J_DATABASE || "");
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

      changeDocumentParent: async (
        _source,
        { nodeId, oldParentIds, newParentId },
        { driver }
      ) => {
        const session = driver.session();
        try {
          if (oldParentIds && oldParentIds.length > 0) {
            // 一次性断开所有选中的父节点关系
            await session.run(
              `
              MATCH (child:Document {id: $nodeId})<-[r:HAS_CHILD]-(parent:Document)
              WHERE parent.id IN $oldParentIds
              DELETE r
              `,
              { nodeId, oldParentIds }
            );
          }

          if (newParentId) {
            // 检查是否已存在关系
            const existingRelation = await session.run(
              `
              MATCH (child:Document {id: $nodeId})<-[r:HAS_CHILD]-(parent:Document {id: $newParentId})
              RETURN r
              `,
              { nodeId, newParentId }
            );

            if (existingRelation.records.length === 0) {
              // 建立与新父节点的关系
              await session.run(
                `
                MATCH (child:Document {id: $nodeId})
                MATCH (parent:Document {id: $newParentId})
                CREATE (parent)-[r:HAS_CHILD {order: 1000}]->(child)
                `,
                { nodeId, newParentId }
              );
            }
          }

          return {
            success: true,
            message: "父节点关系更新成功",
          };
        } catch (error) {
          console.error("更新父节点关系失败:", error);
          return {
            success: false,
            message: "更新父节点关系失败",
          };
        } finally {
          await session.close();
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
    const token = req.headers.authorization || "";
    let currentUser = null;
    let decodedToken: JwtPayload | null = null;

    if (token) {
      try {
        decodedToken = jwt.verify(
          token.replace("Bearer ", ""),
          process.env.JWT_SECRET!
        ) as JwtPayload;

        const [user] = await User.find({ where: { id: decodedToken.sub } });
        currentUser = user;
      } catch (err) {
        console.error("无效或过期的令牌", err);
      }
    }

    return {
      req,
      res,
      currentUser,
      token,
      jwt: decodedToken,
      driver,
    };
  },
});

function generateJwtToken(
  user: { id: string },
  rootId: string,
  userRoles: { name: string }[] = [{ name: "USER" }]
): string {
  return jwt.sign(
    {
      sub: user.id,
      rootId: rootId,
      roles: userRoles.map((role) => role.name),
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "30d",
    }
  );
}
