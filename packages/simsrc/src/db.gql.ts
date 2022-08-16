import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from "graphql"
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
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]>
  Feed: ResolverTypeWrapper<Feed>
  ID: ResolverTypeWrapper<Scalars["ID"]>
  Int: ResolverTypeWrapper<Scalars["Int"]>
  Link: ResolverTypeWrapper<Link>
  LinkOrderByInput: LinkOrderByInput
  Mutation: ResolverTypeWrapper<{}>
  Query: ResolverTypeWrapper<{}>
  String: ResolverTypeWrapper<Scalars["String"]>
  Subscription: ResolverTypeWrapper<{}>
  User: ResolverTypeWrapper<User>
  Vote: ResolverTypeWrapper<Vote>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AuthPayload: AuthPayload
  Boolean: Scalars["Boolean"]
  DateTime: Scalars["DateTime"]
  Feed: Feed
  ID: Scalars["ID"]
  Int: Scalars["Int"]
  Link: Link
  Mutation: {}
  Query: {}
  String: Scalars["String"]
  Subscription: {}
  User: User
  Vote: Vote
}

export type AuthPayloadResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["AuthPayload"] = ResolversParentTypes["AuthPayload"]
> = {
  token?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  user?: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime"
}

export type FeedResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Feed"] = ResolversParentTypes["Feed"]
> = {
  count?: Resolver<ResolversTypes["Int"], ParentType, ContextType>
  links?: Resolver<Array<ResolversTypes["Link"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type LinkResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Link"] = ResolversParentTypes["Link"]
> = {
  createdAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>
  description?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  postedBy?: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>
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

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  feed?: Resolver<
    ResolversTypes["Feed"],
    ParentType,
    ContextType,
    Partial<QueryFeedArgs>
  >
  info?: Resolver<ResolversTypes["String"], ParentType, ContextType>
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

export type UserResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["User"] = ResolversParentTypes["User"]
> = {
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  links?: Resolver<Array<ResolversTypes["Link"]>, ParentType, ContextType>
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type VoteResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Vote"] = ResolversParentTypes["Vote"]
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
  link?: Resolver<ResolversTypes["Link"], ParentType, ContextType>
  user?: Resolver<ResolversTypes["User"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
  AuthPayload?: AuthPayloadResolvers<ContextType>
  DateTime?: GraphQLScalarType
  Feed?: FeedResolvers<ContextType>
  Link?: LinkResolvers<ContextType>
  Mutation?: MutationResolvers<ContextType>
  Query?: QueryResolvers<ContextType>
  Subscription?: SubscriptionResolvers<ContextType>
  User?: UserResolvers<ContextType>
  Vote?: VoteResolvers<ContextType>
}
