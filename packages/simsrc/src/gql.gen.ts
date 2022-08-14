import { GraphQLResolveInfo } from "graphql"
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
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>
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

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Agent: ResolverTypeWrapper<Agent>
  Asset: ResolverTypeWrapper<Asset>
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>
  Discount: ResolverTypeWrapper<Discount>
  Effort: ResolverTypeWrapper<Effort>
  Fund: ResolverTypeWrapper<Fund>
  Funds: ResolverTypeWrapper<Funds>
  Group: ResolverTypeWrapper<Group>
  ID: ResolverTypeWrapper<Scalars["ID"]>
  Input: Input
  Int: ResolverTypeWrapper<Scalars["Int"]>
  Issue: ResolverTypeWrapper<Issue>
  Kind: Kind
  Like: ResolverTypeWrapper<Like>
  Likes: ResolverTypeWrapper<Likes>
  Mission: ResolverTypeWrapper<Mission>
  Mutation: ResolverTypeWrapper<{}>
  Patch: Patch
  Query: ResolverTypeWrapper<{}>
  Request: Request
  Shopify: ResolverTypeWrapper<Shopify>
  Status: ResolverTypeWrapper<Status>
  Step: Step
  String: ResolverTypeWrapper<Scalars["String"]>
  Topics: ResolverTypeWrapper<Topics>
  User: ResolverTypeWrapper<User>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Agent: Agent
  Asset: Asset
  Boolean: Scalars["Boolean"]
  Discount: Discount
  Effort: Effort
  Fund: Fund
  Funds: Funds
  Group: Group
  ID: Scalars["ID"]
  Input: Input
  Int: Scalars["Int"]
  Issue: Issue
  Like: Like
  Likes: Likes
  Mission: Mission
  Mutation: {}
  Query: {}
  Request: Request
  Shopify: Shopify
  Status: Status
  Step: Step
  String: Scalars["String"]
  Topics: Topics
  User: User
}

export type AgentResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Agent"] = ResolversParentTypes["Agent"]
> = {
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  group?: Resolver<Maybe<ResolversTypes["Group"]>, ParentType, ContextType>
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  shopify?: Resolver<Maybe<ResolversTypes["Shopify"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type AssetResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Asset"] = ResolversParentTypes["Asset"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  type?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type DiscountResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Discount"] = ResolversParentTypes["Discount"]
> = {
  code?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  used?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type EffortResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Effort"] = ResolversParentTypes["Effort"]
> = {
  closed?: Resolver<
    Array<Maybe<ResolversTypes["Issue"]>>,
    ParentType,
    ContextType
  >
  weight?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type FundResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Fund"] = ResolversParentTypes["Fund"]
> = {
  asset?: Resolver<Maybe<ResolversTypes["Asset"]>, ParentType, ContextType>
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  isBought?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  mission?: Resolver<Maybe<ResolversTypes["Mission"]>, ParentType, ContextType>
  price?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type FundsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Funds"] = ResolversParentTypes["Funds"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  funds?: Resolver<
    Array<Maybe<ResolversTypes["Fund"]>>,
    ParentType,
    ContextType
  >
  more?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type GroupResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Group"] = ResolversParentTypes["Group"]
> = {
  closed?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["Issue"]>>>,
    ParentType,
    ContextType
  >
  name?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  weight?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type IssueResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Issue"] = ResolversParentTypes["Issue"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  missions?: Resolver<
    Array<Maybe<ResolversTypes["Mission"]>>,
    ParentType,
    ContextType
  >
  rank?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  tags?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  title?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type LikeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Like"] = ResolversParentTypes["Like"]
> = {
  comment?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  date?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  rating?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  step?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  url?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type LikesResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Likes"] = ResolversParentTypes["Likes"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  likes?: Resolver<
    Array<Maybe<ResolversTypes["Like"]>>,
    ParentType,
    ContextType
  >
  more?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MissionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Mission"] = ResolversParentTypes["Mission"]
> = {
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  patch?: Resolver<Maybe<ResolversTypes["Patch"]>, ParentType, ContextType>
  url?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]
> = {
  buySome?: Resolver<
    ResolversTypes["Status"],
    ParentType,
    ContextType,
    RequireFields<MutationBuySomeArgs, "ids">
  >
  join?: Resolver<
    Maybe<ResolversTypes["Agent"]>,
    ParentType,
    ContextType,
    Partial<MutationJoinArgs>
  >
  like?: Resolver<
    Maybe<ResolversTypes["Like"]>,
    ParentType,
    ContextType,
    Partial<MutationLikeArgs>
  >
  login?: Resolver<
    Maybe<ResolversTypes["User"]>,
    ParentType,
    ContextType,
    Partial<MutationLoginArgs>
  >
  process?: Resolver<
    ResolversTypes["Like"],
    ParentType,
    ContextType,
    RequireFields<MutationProcessArgs, "id">
  >
  register?: Resolver<
    Maybe<ResolversTypes["User"]>,
    ParentType,
    ContextType,
    Partial<MutationRegisterArgs>
  >
  reward?: Resolver<
    Maybe<ResolversTypes["Agent"]>,
    ParentType,
    ContextType,
    RequireFields<MutationRewardArgs, "email">
  >
  sell?: Resolver<
    ResolversTypes["Status"],
    ParentType,
    ContextType,
    RequireFields<MutationSellArgs, "id">
  >
}

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  agent?: Resolver<
    Maybe<ResolversTypes["Agent"]>,
    ParentType,
    ContextType,
    RequireFields<QueryAgentArgs, "id">
  >
  fund?: Resolver<
    Maybe<ResolversTypes["Fund"]>,
    ParentType,
    ContextType,
    RequireFields<QueryFundArgs, "id">
  >
  funds?: Resolver<
    ResolversTypes["Funds"],
    ParentType,
    ContextType,
    Partial<QueryFundsArgs>
  >
  likes?: Resolver<
    ResolversTypes["Likes"],
    ParentType,
    ContextType,
    Partial<QueryLikesArgs>
  >
  me?: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>
  ping?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  topics?: Resolver<
    ResolversTypes["Topics"],
    ParentType,
    ContextType,
    RequireFields<QueryTopicsArgs, "tags">
  >
}

export type ShopifyResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Shopify"] = ResolversParentTypes["Shopify"]
> = {
  codes?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["Discount"]>>>,
    ParentType,
    ContextType
  >
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type StatusResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Status"] = ResolversParentTypes["Status"]
> = {
  funds?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["Fund"]>>>,
    ParentType,
    ContextType
  >
  note?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  ok?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TopicsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Topics"] = ResolversParentTypes["Topics"]
> = {
  issues?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["Issue"]>>>,
    ParentType,
    ContextType
  >
  weight?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type UserResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["User"] = ResolversParentTypes["User"]
> = {
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  funds?: Resolver<
    Array<Maybe<ResolversTypes["Fund"]>>,
    ParentType,
    ContextType
  >
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  profile?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  token?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
  Agent?: AgentResolvers<ContextType>
  Asset?: AssetResolvers<ContextType>
  Discount?: DiscountResolvers<ContextType>
  Effort?: EffortResolvers<ContextType>
  Fund?: FundResolvers<ContextType>
  Funds?: FundsResolvers<ContextType>
  Group?: GroupResolvers<ContextType>
  Issue?: IssueResolvers<ContextType>
  Like?: LikeResolvers<ContextType>
  Likes?: LikesResolvers<ContextType>
  Mission?: MissionResolvers<ContextType>
  Mutation?: MutationResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Shopify?: ShopifyResolvers<ContextType>
  Status?: StatusResolvers<ContextType>
  Topics?: TopicsResolvers<ContextType>
  User?: UserResolvers<ContextType>
}
