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
  DateTime: any
}

export type AuthPayload = {
  __typename?: "AuthPayload"
  token?: Maybe<Scalars["String"]>
  user?: Maybe<User>
}

export type Feed = {
  __typename?: "Feed"
  count: Scalars["Int"]
  links: Array<Link>
}

export type Link = {
  __typename?: "Link"
  createdAt: Scalars["DateTime"]
  description: Scalars["String"]
  id: Scalars["ID"]
  postedBy?: Maybe<User>
  url: Scalars["String"]
  votes: Array<Vote>
}

export enum LinkOrderByInput {
  CreatedAtAsc = "createdAt_ASC",
  CreatedAtDesc = "createdAt_DESC",
  DescriptionAsc = "description_ASC",
  DescriptionDesc = "description_DESC",
  UrlAsc = "url_ASC",
  UrlDesc = "url_DESC",
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

export type Query = {
  __typename?: "Query"
  feed: Feed
  info: Scalars["String"]
}

export type QueryFeedArgs = {
  filter?: InputMaybe<Scalars["String"]>
  first?: InputMaybe<Scalars["Int"]>
  orderBy?: InputMaybe<LinkOrderByInput>
  skip?: InputMaybe<Scalars["Int"]>
}

export type Subscription = {
  __typename?: "Subscription"
  newLink?: Maybe<Link>
  newVote?: Maybe<Vote>
}

export type User = {
  __typename?: "User"
  email: Scalars["String"]
  id: Scalars["ID"]
  links: Array<Link>
  name: Scalars["String"]
}

export type Vote = {
  __typename?: "Vote"
  id: Scalars["ID"]
  link: Link
  user: User
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
