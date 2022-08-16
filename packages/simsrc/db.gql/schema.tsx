import { gql } from "graphql-tag"

export default gql`
  type Query {
    nodes(batch: Int, after: String): QNodes!
    node(id: ID!): QNode
    edges(batch: Int, after: String): QEdges!
    edge(id: ID!): QEdge
  }
  type QNodes {
    cursor: String!
    more: Boolean!
    nodes: [QNode]!
  }
  type QNode {
    id: ID!
    name: String!
    size: Int!
  }
  type QEdges {
    cursor: String!
    more: Boolean!
    edges: [QEdge]!
  }
  type QEdge {
    id: ID!
    name: String!
    size: Int!
    in: QNode!
    out: QNode!
  }
  type Mutation {
    post(url: String!, description: String!): Link!
    signup(email: String!, password: String!, name: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    vote(linkId: ID!): Vote!
  }
  type Subscription {
    newLink: Link
    newVote: Vote
  }
  type AuthPayload {
    token: String
  }
  type Link {
    id: ID!
    description: String!
    url: String!
    votes: [Vote!]!
  }
  type Vote {
    id: ID!
    link: Link!
  }
`
