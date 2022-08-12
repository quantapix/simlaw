import { gql } from "apollo-server"

export const typeDefs = gql`
  type Query {
    funds(batch: Int, after: String): Funds!
    fund(id: ID!): Fund
    topics(tags: String!): Topics!
    agent(id: ID!): Agent
    likes(batch: Int, after: String): Likes!
    ping: String!
    me: User
  }
  type Funds {
    cursor: String!
    more: Boolean!
    funds: [Fund]!
  }
  type Fund {
    id: ID!
    asset: Asset
    price: String
    mission: Mission
    isBought: Boolean!
  }
  type Topics {
    weight: Int!
    issues: [Issue]
  }
  type Agent {
    id: ID!
    email: String!
    group: Group
    shopify: Shopify
  }
  type Likes {
    cursor: String!
    more: Boolean!
    likes: [Like]!
  }
  type User {
    id: ID!
    email: String!
    profile: String
    funds: [Fund]!
    token: String
  }
  type Mutation {
    buySome(ids: [ID]!): Status!
    sell(id: ID!): Status!
    register(req: Request): User
    join(req: Request): Agent
    reward(email: String!): Agent
    like(input: Input): Like
    process(id: ID!): Like!
    login(email: String): User
  }
  type Status {
    ok: Boolean!
    note: String
    funds: [Fund]
  }
  input Request {
    name: String!
    email: String!
    profile: String
  }
  input Input {
    rating: Int!
    comment: String
    url: String!
  }
  type Like {
    id: ID!
    rating: Int!
    comment: String
    url: String!
    date: String!
    step: Step
  }
  input Step {
    id: ID!
    kind: Kind!
  }
  type Asset {
    id: ID!
    name: String
    type: String
  }
  type Mission {
    name: String!
    url: String!
    patch: Patch
  }
  enum Patch {
    SMALL
    LARGE
  }
  type Group {
    name: ID!
    weight: Int!
    closed: [Issue]
  }
  type Issue {
    id: ID!
    title: String!
    tags: String!
    rank: Int!
    missions: [Mission]!
  }
  type Shopify {
    id: ID!
    codes: [Discount]
  }
  type Discount {
    code: String!
    used: Boolean!
  }
  type Effort {
    weight: Int!
    closed: [Issue]!
  }
  enum Kind {
    OPEN
    CLOSED
  }
`
