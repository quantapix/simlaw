import gql from "graphql-tag"
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export type AuthPayload = {
  __typename?: "AuthPayload"
  token?: Maybe<Scalars["String"]>
}

export type Link = {
  __typename?: "Link"
  description: Scalars["String"]
  id: Scalars["ID"]
  url: Scalars["String"]
  votes: Array<Vote>
}

export type Mutation = {
  __typename?: "Mutation"
  login?: Maybe<AuthPayload>
  post: Link
  signup?: Maybe<AuthPayload>
  vote: Vote
}

export type MutationLoginArgs = {
  email: Scalars["String"]
  password: Scalars["String"]
}

export type MutationPostArgs = {
  description: Scalars["String"]
  url: Scalars["String"]
}

export type MutationSignupArgs = {
  email: Scalars["String"]
  name: Scalars["String"]
  password: Scalars["String"]
}

export type MutationVoteArgs = {
  linkId: Scalars["ID"]
}

export type QEdge = {
  __typename?: "QEdge"
  id: Scalars["ID"]
  in: QNode
  name: Scalars["String"]
  out: QNode
  size: Scalars["Int"]
}

export type QEdges = {
  __typename?: "QEdges"
  cursor: Scalars["String"]
  edges: Array<Maybe<QEdge>>
  more: Scalars["Boolean"]
}

export type QNode = {
  __typename?: "QNode"
  id: Scalars["ID"]
  name: Scalars["String"]
  size: Scalars["Int"]
}

export type QNodes = {
  __typename?: "QNodes"
  cursor: Scalars["String"]
  more: Scalars["Boolean"]
  nodes: Array<Maybe<QNode>>
}

export type Query = {
  __typename?: "Query"
  edge?: Maybe<QEdge>
  edges: QEdges
  node?: Maybe<QNode>
  nodes: QNodes
}

export type QueryEdgeArgs = {
  id: Scalars["ID"]
}

export type QueryEdgesArgs = {
  after?: InputMaybe<Scalars["String"]>
  batch?: InputMaybe<Scalars["Int"]>
}

export type QueryNodeArgs = {
  id: Scalars["ID"]
}

export type QueryNodesArgs = {
  after?: InputMaybe<Scalars["String"]>
  batch?: InputMaybe<Scalars["Int"]>
}

export type Subscription = {
  __typename?: "Subscription"
  newLink?: Maybe<Link>
  newVote?: Maybe<Vote>
}

export type Vote = {
  __typename?: "Vote"
  id: Scalars["ID"]
  link: Link
}

export interface PossibleTypesResultData {
  possibleTypes: {
    [key: string]: string[]
  }
}
const result: PossibleTypesResultData = {
  possibleTypes: {},
}
export default result
