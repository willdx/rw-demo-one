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

  type Role {
    id: ID! @id
    name: String! @unique
    users: [User!]! @relationship(type: "HAS_ROLE", direction: IN)
  }

  type Document {
    id: ID! @id
    fileName: String!
    content: String!
    createdAt: DateTime! @timestamp(operations: [CREATE])
    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
    deletedAt: DateTime
    children: [Document!]!
      @relationship(type: "HAS_CHILD", direction: OUT, properties: "ChildOrder")
    parent: Document @relationship(type: "HAS_CHILD", direction: IN)
    creator: User! @relationship(type: "CREATED", direction: IN)
  }

  type ChildOrder @relationshipProperties {
    order: Float!
  }

  type Mutation {
    signUp(email: String!, password: String!, username: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

const ogm = new OGM({ typeDefs, driver });
const User = ogm.model("User");

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  driver,
  resolvers: {
    Mutation: {
      signUp: async (_source, { username, email, password }) => {
        const [existing] = await User.find({
          where: { email },
        });

        if (existing) {
          throw new Error(`邮箱已存在`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { users } = await User.create({
          input: [
            {
              username,
              email,
              password: hashedPassword,
            },
          ],
        });

        const token = jwt.sign(
          { userId: users[0].id },
          process.env.JWT_SECRET!,
          { expiresIn: "1d" }
        );

        return {
          token,
          user: users[0],
        };
      },

      signIn: async (_source, { email, password }) => {
        const [user] = await User.find({
          where: { email },
        });

        if (!user) {
          throw new Error(`用户不存在`);
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
          throw new Error(`密码错误`);
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
          expiresIn: "1d",
        });

        return {
          token,
          user,
        };
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

export default startServerAndCreateNextHandler(await createApolloServer());
