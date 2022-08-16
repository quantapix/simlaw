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
  AuthPayload: ResolverTypeWrapper<AuthPayload>
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>
  ID: ResolverTypeWrapper<Scalars["ID"]>
  Int: ResolverTypeWrapper<Scalars["Int"]>
  Link: ResolverTypeWrapper<Link>
  Mutation: ResolverTypeWrapper<{}>
  QEdge: ResolverTypeWrapper<QEdge>
  QEdges: ResolverTypeWrapper<QEdges>
  QNode: ResolverTypeWrapper<QNode>
  QNodes: ResolverTypeWrapper<QNodes>
  Query: ResolverTypeWrapper<{}>
  String: ResolverTypeWrapper<Scalars["String"]>
  Subscription: ResolverTypeWrapper<{}>
  Vote: ResolverTypeWrapper<Vote>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AuthPayload: AuthPayload
  Boolean: Scalars["Boolean"]
  ID: Scalars["ID"]
  Int: Scalars["Int"]
  Link: Link
  Mutation: {}
  QEdge: QEdge
  QEdges: QEdges
  QNode: QNode
  QNodes: QNodes
  Query: {}
  String: Scalars["String"]
  Subscription: {}
  Vote: Vote
}

export type AuthPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["AuthPayload"] = ResolversParentTypes["AuthPayload"]
> = {
  token?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type LinkResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Link"] = ResolversParentTypes["Link"]
> = {
  description?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  url?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  votes?: Resolver<Array<ResolversTypes["Vote"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]
> = {
  login?: Resolver<
    Maybe<ResolversTypes["AuthPayload"]>,
    ParentType,
    ContextType,
    RequireFields<MutationLoginArgs, "email" | "password">
  >
  post?: Resolver<
    ResolversTypes["Link"],
    ParentType,
    ContextType,
    RequireFields<MutationPostArgs, "description" | "url">
  >
  signup?: Resolver<
    Maybe<ResolversTypes["AuthPayload"]>,
    ParentType,
    ContextType,
    RequireFields<MutationSignupArgs, "email" | "name" | "password">
  >
  vote?: Resolver<
    ResolversTypes["Vote"],
    ParentType,
    ContextType,
    RequireFields<MutationVoteArgs, "linkId">
  >
}

export type QEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["QEdge"] = ResolversParentTypes["QEdge"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  in?: Resolver<ResolversTypes["QNode"], ParentType, ContextType>
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  out?: Resolver<ResolversTypes["QNode"], ParentType, ContextType>
  size?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QEdgesResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["QEdges"] = ResolversParentTypes["QEdges"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  edges?: Resolver<
    Array<Maybe<ResolversTypes["QEdge"]>>,
    ParentType,
    ContextType
  >
  more?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QNodeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["QNode"] = ResolversParentTypes["QNode"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  size?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QNodesResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["QNodes"] = ResolversParentTypes["QNodes"]
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  more?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  nodes?: Resolver<
    Array<Maybe<ResolversTypes["QNode"]>>,
    ParentType,
    ContextType
  >
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  edge?: Resolver<
    Maybe<ResolversTypes["QEdge"]>,
    ParentType,
    ContextType,
    RequireFields<QueryEdgeArgs, "id">
  >
  edges?: Resolver<
    ResolversTypes["QEdges"],
    ParentType,
    ContextType,
    Partial<QueryEdgesArgs>
  >
  node?: Resolver<
    Maybe<ResolversTypes["QNode"]>,
    ParentType,
    ContextType,
    RequireFields<QueryNodeArgs, "id">
  >
  nodes?: Resolver<
    ResolversTypes["QNodes"],
    ParentType,
    ContextType,
    Partial<QueryNodesArgs>
  >
}

export type SubscriptionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Subscription"] = ResolversParentTypes["Subscription"]
> = {
  newLink?: SubscriptionResolver<
    Maybe<ResolversTypes["Link"]>,
    "newLink",
    ParentType,
    ContextType
  >
  newVote?: SubscriptionResolver<
    Maybe<ResolversTypes["Vote"]>,
    "newVote",
    ParentType,
    ContextType
  >
}

export type VoteResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Vote"] = ResolversParentTypes["Vote"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  link?: Resolver<ResolversTypes["Link"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
  AuthPayload?: AuthPayloadResolvers<ContextType>
  Link?: LinkResolvers<ContextType>
  Mutation?: MutationResolvers<ContextType>
  QEdge?: QEdgeResolvers<ContextType>
  QEdges?: QEdgesResolvers<ContextType>
  QNode?: QNodeResolvers<ContextType>
  QNodes?: QNodesResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Subscription?: SubscriptionResolvers<ContextType>
  Vote?: VoteResolvers<ContextType>
}
