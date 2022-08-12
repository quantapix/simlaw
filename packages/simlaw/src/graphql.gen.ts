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

export type Agent = {
  __typename?: "Agent"
  email: Scalars["String"]
  group?: Maybe<Group>
  id: Scalars["ID"]
  shopify?: Maybe<Shopify>
}

export type Asset = {
  __typename?: "Asset"
  id: Scalars["ID"]
  name?: Maybe<Scalars["String"]>
  type?: Maybe<Scalars["String"]>
}

export type Discount = {
  __typename?: "Discount"
  code: Scalars["String"]
  used: Scalars["Boolean"]
}

export type Effort = {
  __typename?: "Effort"
  closed: Array<Maybe<Issue>>
  weight: Scalars["Int"]
}

export type Fund = {
  __typename?: "Fund"
  asset?: Maybe<Asset>
  id: Scalars["ID"]
  isBought: Scalars["Boolean"]
  mission?: Maybe<Mission>
  price?: Maybe<Scalars["String"]>
}

export type Funds = {
  __typename?: "Funds"
  cursor: Scalars["String"]
  funds: Array<Maybe<Fund>>
  more: Scalars["Boolean"]
}

export type Group = {
  __typename?: "Group"
  closed?: Maybe<Array<Maybe<Issue>>>
  name: Scalars["ID"]
  weight: Scalars["Int"]
}

export type Input = {
  comment?: InputMaybe<Scalars["String"]>
  rating: Scalars["Int"]
  url: Scalars["String"]
}

export type Issue = {
  __typename?: "Issue"
  id: Scalars["ID"]
  missions: Array<Maybe<Mission>>
  rank: Scalars["Int"]
  tags: Scalars["String"]
  title: Scalars["String"]
}

export enum Kind {
  Closed = "CLOSED",
  Open = "OPEN",
}

export type Like = {
  __typename?: "Like"
  comment?: Maybe<Scalars["String"]>
  date: Scalars["String"]
  id: Scalars["ID"]
  rating: Scalars["Int"]
  step: Scalars["String"]
  url: Scalars["String"]
}

export type Likes = {
  __typename?: "Likes"
  cursor: Scalars["String"]
  likes: Array<Maybe<Like>>
  more: Scalars["Boolean"]
}

export type Mission = {
  __typename?: "Mission"
  name: Scalars["String"]
  patch?: Maybe<Patch>
  url: Scalars["String"]
}

export type Mutation = {
  __typename?: "Mutation"
  buySome: Status
  join?: Maybe<Agent>
  like?: Maybe<Like>
  login?: Maybe<User>
  process: Like
  register?: Maybe<User>
  reward?: Maybe<Agent>
  sell: Status
}

export type MutationBuySomeArgs = {
  ids: Array<InputMaybe<Scalars["ID"]>>
}

export type MutationJoinArgs = {
  req?: InputMaybe<Request>
}

export type MutationLikeArgs = {
  input?: InputMaybe<Input>
}

export type MutationLoginArgs = {
  email?: InputMaybe<Scalars["String"]>
}

export type MutationProcessArgs = {
  id: Scalars["ID"]
}

export type MutationRegisterArgs = {
  req?: InputMaybe<Request>
}

export type MutationRewardArgs = {
  email: Scalars["String"]
}

export type MutationSellArgs = {
  id: Scalars["ID"]
}

export enum Patch {
  Large = "LARGE",
  Small = "SMALL",
}

export type Query = {
  __typename?: "Query"
  agent?: Maybe<Agent>
  fund?: Maybe<Fund>
  funds: Funds
  likes: Likes
  me?: Maybe<User>
  ping: Scalars["String"]
  topics: Topics
}

export type QueryAgentArgs = {
  id: Scalars["ID"]
}

export type QueryFundArgs = {
  id: Scalars["ID"]
}

export type QueryFundsArgs = {
  after?: InputMaybe<Scalars["String"]>
  batch?: InputMaybe<Scalars["Int"]>
}

export type QueryLikesArgs = {
  after?: InputMaybe<Scalars["String"]>
  batch?: InputMaybe<Scalars["Int"]>
}

export type QueryTopicsArgs = {
  tags: Scalars["String"]
}

export type Request = {
  email: Scalars["String"]
  name: Scalars["String"]
  profile?: InputMaybe<Scalars["String"]>
}

export type Shopify = {
  __typename?: "Shopify"
  codes?: Maybe<Array<Maybe<Discount>>>
  id: Scalars["ID"]
}

export type Status = {
  __typename?: "Status"
  funds?: Maybe<Array<Maybe<Fund>>>
  note?: Maybe<Scalars["String"]>
  ok: Scalars["Boolean"]
}

export type Step = {
  id: Scalars["ID"]
  kind: Kind
}

export type Topics = {
  __typename?: "Topics"
  issues?: Maybe<Array<Maybe<Issue>>>
  weight: Scalars["Int"]
}

export type User = {
  __typename?: "User"
  email: Scalars["String"]
  funds: Array<Maybe<Fund>>
  id: Scalars["ID"]
  profile?: Maybe<Scalars["String"]>
  token?: Maybe<Scalars["String"]>
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
