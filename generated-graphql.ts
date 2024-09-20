import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
};

/**
 * The edge properties for the following fields:
 * * Document.children
 */
export type ChildOrder = {
  __typename?: 'ChildOrder';
  order: Scalars['Float']['output'];
};

export type ChildOrderAggregationWhereInput = {
  AND?: InputMaybe<Array<ChildOrderAggregationWhereInput>>;
  NOT?: InputMaybe<ChildOrderAggregationWhereInput>;
  OR?: InputMaybe<Array<ChildOrderAggregationWhereInput>>;
  order_AVERAGE_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  order_AVERAGE_GT?: InputMaybe<Scalars['Float']['input']>;
  order_AVERAGE_GTE?: InputMaybe<Scalars['Float']['input']>;
  order_AVERAGE_LT?: InputMaybe<Scalars['Float']['input']>;
  order_AVERAGE_LTE?: InputMaybe<Scalars['Float']['input']>;
  order_MAX_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  order_MAX_GT?: InputMaybe<Scalars['Float']['input']>;
  order_MAX_GTE?: InputMaybe<Scalars['Float']['input']>;
  order_MAX_LT?: InputMaybe<Scalars['Float']['input']>;
  order_MAX_LTE?: InputMaybe<Scalars['Float']['input']>;
  order_MIN_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  order_MIN_GT?: InputMaybe<Scalars['Float']['input']>;
  order_MIN_GTE?: InputMaybe<Scalars['Float']['input']>;
  order_MIN_LT?: InputMaybe<Scalars['Float']['input']>;
  order_MIN_LTE?: InputMaybe<Scalars['Float']['input']>;
  order_SUM_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  order_SUM_GT?: InputMaybe<Scalars['Float']['input']>;
  order_SUM_GTE?: InputMaybe<Scalars['Float']['input']>;
  order_SUM_LT?: InputMaybe<Scalars['Float']['input']>;
  order_SUM_LTE?: InputMaybe<Scalars['Float']['input']>;
};

export type ChildOrderCreateInput = {
  order: Scalars['Float']['input'];
};

export type ChildOrderSort = {
  order?: InputMaybe<SortDirection>;
};

export type ChildOrderUpdateInput = {
  order?: InputMaybe<Scalars['Float']['input']>;
  order_ADD?: InputMaybe<Scalars['Float']['input']>;
  order_DIVIDE?: InputMaybe<Scalars['Float']['input']>;
  order_MULTIPLY?: InputMaybe<Scalars['Float']['input']>;
  order_SUBTRACT?: InputMaybe<Scalars['Float']['input']>;
};

export type ChildOrderWhere = {
  AND?: InputMaybe<Array<ChildOrderWhere>>;
  NOT?: InputMaybe<ChildOrderWhere>;
  OR?: InputMaybe<Array<ChildOrderWhere>>;
  order?: InputMaybe<Scalars['Float']['input']>;
  order_GT?: InputMaybe<Scalars['Float']['input']>;
  order_GTE?: InputMaybe<Scalars['Float']['input']>;
  order_IN?: InputMaybe<Array<Scalars['Float']['input']>>;
  order_LT?: InputMaybe<Scalars['Float']['input']>;
  order_LTE?: InputMaybe<Scalars['Float']['input']>;
};

export type CreateDocumentsMutationResponse = {
  __typename?: 'CreateDocumentsMutationResponse';
  documents: Array<Document>;
  info: CreateInfo;
};

/** Information about the number of nodes and relationships created during a create mutation */
export type CreateInfo = {
  __typename?: 'CreateInfo';
  /** @deprecated This field has been deprecated because bookmarks are now handled by the driver. */
  bookmark?: Maybe<Scalars['String']['output']>;
  nodesCreated: Scalars['Int']['output'];
  relationshipsCreated: Scalars['Int']['output'];
};

export type DateTimeAggregateSelection = {
  __typename?: 'DateTimeAggregateSelection';
  max?: Maybe<Scalars['DateTime']['output']>;
  min?: Maybe<Scalars['DateTime']['output']>;
};

/** Information about the number of nodes and relationships deleted during a delete mutation */
export type DeleteInfo = {
  __typename?: 'DeleteInfo';
  /** @deprecated This field has been deprecated because bookmarks are now handled by the driver. */
  bookmark?: Maybe<Scalars['String']['output']>;
  nodesDeleted: Scalars['Int']['output'];
  relationshipsDeleted: Scalars['Int']['output'];
};

export type Document = {
  __typename?: 'Document';
  children: Array<Document>;
  childrenAggregate?: Maybe<DocumentDocumentChildrenAggregationSelection>;
  childrenConnection: DocumentChildrenConnection;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  parent?: Maybe<Document>;
  parentAggregate?: Maybe<DocumentDocumentParentAggregationSelection>;
  parentConnection: DocumentParentConnection;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};


export type DocumentChildrenArgs = {
  directed?: InputMaybe<Scalars['Boolean']['input']>;
  options?: InputMaybe<DocumentOptions>;
  where?: InputMaybe<DocumentWhere>;
};


export type DocumentChildrenAggregateArgs = {
  directed?: InputMaybe<Scalars['Boolean']['input']>;
  where?: InputMaybe<DocumentWhere>;
};


export type DocumentChildrenConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  directed?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<DocumentChildrenConnectionSort>>;
  where?: InputMaybe<DocumentChildrenConnectionWhere>;
};


export type DocumentParentArgs = {
  directed?: InputMaybe<Scalars['Boolean']['input']>;
  options?: InputMaybe<DocumentOptions>;
  where?: InputMaybe<DocumentWhere>;
};


export type DocumentParentAggregateArgs = {
  directed?: InputMaybe<Scalars['Boolean']['input']>;
  where?: InputMaybe<DocumentWhere>;
};


export type DocumentParentConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  directed?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<DocumentParentConnectionSort>>;
  where?: InputMaybe<DocumentParentConnectionWhere>;
};

export type DocumentAggregateSelection = {
  __typename?: 'DocumentAggregateSelection';
  content: StringAggregateSelection;
  count: Scalars['Int']['output'];
  createdAt: DateTimeAggregateSelection;
  deletedAt: DateTimeAggregateSelection;
  fileName: StringAggregateSelection;
  id: IdAggregateSelection;
  updatedAt: DateTimeAggregateSelection;
  userId: StringAggregateSelection;
};

export type DocumentChildrenAggregateInput = {
  AND?: InputMaybe<Array<DocumentChildrenAggregateInput>>;
  NOT?: InputMaybe<DocumentChildrenAggregateInput>;
  OR?: InputMaybe<Array<DocumentChildrenAggregateInput>>;
  count?: InputMaybe<Scalars['Int']['input']>;
  count_GT?: InputMaybe<Scalars['Int']['input']>;
  count_GTE?: InputMaybe<Scalars['Int']['input']>;
  count_LT?: InputMaybe<Scalars['Int']['input']>;
  count_LTE?: InputMaybe<Scalars['Int']['input']>;
  edge?: InputMaybe<ChildOrderAggregationWhereInput>;
  node?: InputMaybe<DocumentChildrenNodeAggregationWhereInput>;
};

export type DocumentChildrenConnectFieldInput = {
  connect?: InputMaybe<Array<DocumentConnectInput>>;
  edge: ChildOrderCreateInput;
  /** Whether or not to overwrite any matching relationship with the new properties. */
  overwrite?: Scalars['Boolean']['input'];
  where?: InputMaybe<DocumentConnectWhere>;
};

export type DocumentChildrenConnection = {
  __typename?: 'DocumentChildrenConnection';
  edges: Array<DocumentChildrenRelationship>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type DocumentChildrenConnectionSort = {
  edge?: InputMaybe<ChildOrderSort>;
  node?: InputMaybe<DocumentSort>;
};

export type DocumentChildrenConnectionWhere = {
  AND?: InputMaybe<Array<DocumentChildrenConnectionWhere>>;
  NOT?: InputMaybe<DocumentChildrenConnectionWhere>;
  OR?: InputMaybe<Array<DocumentChildrenConnectionWhere>>;
  edge?: InputMaybe<ChildOrderWhere>;
  node?: InputMaybe<DocumentWhere>;
};

export type DocumentChildrenCreateFieldInput = {
  edge: ChildOrderCreateInput;
  node: DocumentCreateInput;
};

export type DocumentChildrenDeleteFieldInput = {
  delete?: InputMaybe<DocumentDeleteInput>;
  where?: InputMaybe<DocumentChildrenConnectionWhere>;
};

export type DocumentChildrenDisconnectFieldInput = {
  disconnect?: InputMaybe<DocumentDisconnectInput>;
  where?: InputMaybe<DocumentChildrenConnectionWhere>;
};

export type DocumentChildrenFieldInput = {
  connect?: InputMaybe<Array<DocumentChildrenConnectFieldInput>>;
  create?: InputMaybe<Array<DocumentChildrenCreateFieldInput>>;
};

export type DocumentChildrenNodeAggregationWhereInput = {
  AND?: InputMaybe<Array<DocumentChildrenNodeAggregationWhereInput>>;
  NOT?: InputMaybe<DocumentChildrenNodeAggregationWhereInput>;
  OR?: InputMaybe<Array<DocumentChildrenNodeAggregationWhereInput>>;
  content_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_GT?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_LT?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars['Float']['input']>;
  content_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  createdAt_MAX_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_GT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_LT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_GT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_LT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_GT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_LT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_GT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_LT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  fileName_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_GT?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_LT?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars['Float']['input']>;
  fileName_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  updatedAt_MAX_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_GT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_LT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_GT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_LT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  userId_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_GT?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_LT?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars['Float']['input']>;
  userId_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
};

export type DocumentChildrenRelationship = {
  __typename?: 'DocumentChildrenRelationship';
  cursor: Scalars['String']['output'];
  node: Document;
  properties: ChildOrder;
};

export type DocumentChildrenUpdateConnectionInput = {
  edge?: InputMaybe<ChildOrderUpdateInput>;
  node?: InputMaybe<DocumentUpdateInput>;
};

export type DocumentChildrenUpdateFieldInput = {
  connect?: InputMaybe<Array<DocumentChildrenConnectFieldInput>>;
  create?: InputMaybe<Array<DocumentChildrenCreateFieldInput>>;
  delete?: InputMaybe<Array<DocumentChildrenDeleteFieldInput>>;
  disconnect?: InputMaybe<Array<DocumentChildrenDisconnectFieldInput>>;
  update?: InputMaybe<DocumentChildrenUpdateConnectionInput>;
  where?: InputMaybe<DocumentChildrenConnectionWhere>;
};

export type DocumentConnectInput = {
  children?: InputMaybe<Array<DocumentChildrenConnectFieldInput>>;
  parent?: InputMaybe<DocumentParentConnectFieldInput>;
};

export type DocumentConnectWhere = {
  node: DocumentWhere;
};

export type DocumentCreateInput = {
  children?: InputMaybe<DocumentChildrenFieldInput>;
  content: Scalars['String']['input'];
  deletedAt?: InputMaybe<Scalars['DateTime']['input']>;
  fileName: Scalars['String']['input'];
  parent?: InputMaybe<DocumentParentFieldInput>;
  userId: Scalars['String']['input'];
};

export type DocumentDeleteInput = {
  children?: InputMaybe<Array<DocumentChildrenDeleteFieldInput>>;
  parent?: InputMaybe<DocumentParentDeleteFieldInput>;
};

export type DocumentDisconnectInput = {
  children?: InputMaybe<Array<DocumentChildrenDisconnectFieldInput>>;
  parent?: InputMaybe<DocumentParentDisconnectFieldInput>;
};

export type DocumentDocumentChildrenAggregationSelection = {
  __typename?: 'DocumentDocumentChildrenAggregationSelection';
  count: Scalars['Int']['output'];
  edge?: Maybe<DocumentDocumentChildrenEdgeAggregateSelection>;
  node?: Maybe<DocumentDocumentChildrenNodeAggregateSelection>;
};

export type DocumentDocumentChildrenEdgeAggregateSelection = {
  __typename?: 'DocumentDocumentChildrenEdgeAggregateSelection';
  order: FloatAggregateSelection;
};

export type DocumentDocumentChildrenNodeAggregateSelection = {
  __typename?: 'DocumentDocumentChildrenNodeAggregateSelection';
  content: StringAggregateSelection;
  createdAt: DateTimeAggregateSelection;
  deletedAt: DateTimeAggregateSelection;
  fileName: StringAggregateSelection;
  id: IdAggregateSelection;
  updatedAt: DateTimeAggregateSelection;
  userId: StringAggregateSelection;
};

export type DocumentDocumentParentAggregationSelection = {
  __typename?: 'DocumentDocumentParentAggregationSelection';
  count: Scalars['Int']['output'];
  node?: Maybe<DocumentDocumentParentNodeAggregateSelection>;
};

export type DocumentDocumentParentNodeAggregateSelection = {
  __typename?: 'DocumentDocumentParentNodeAggregateSelection';
  content: StringAggregateSelection;
  createdAt: DateTimeAggregateSelection;
  deletedAt: DateTimeAggregateSelection;
  fileName: StringAggregateSelection;
  id: IdAggregateSelection;
  updatedAt: DateTimeAggregateSelection;
  userId: StringAggregateSelection;
};

export type DocumentEdge = {
  __typename?: 'DocumentEdge';
  cursor: Scalars['String']['output'];
  node: Document;
};

export type DocumentOptions = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Specify one or more DocumentSort objects to sort Documents by. The sorts will be applied in the order in which they are arranged in the array. */
  sort?: InputMaybe<Array<DocumentSort>>;
};

export type DocumentParentAggregateInput = {
  AND?: InputMaybe<Array<DocumentParentAggregateInput>>;
  NOT?: InputMaybe<DocumentParentAggregateInput>;
  OR?: InputMaybe<Array<DocumentParentAggregateInput>>;
  count?: InputMaybe<Scalars['Int']['input']>;
  count_GT?: InputMaybe<Scalars['Int']['input']>;
  count_GTE?: InputMaybe<Scalars['Int']['input']>;
  count_LT?: InputMaybe<Scalars['Int']['input']>;
  count_LTE?: InputMaybe<Scalars['Int']['input']>;
  node?: InputMaybe<DocumentParentNodeAggregationWhereInput>;
};

export type DocumentParentConnectFieldInput = {
  connect?: InputMaybe<DocumentConnectInput>;
  /** Whether or not to overwrite any matching relationship with the new properties. */
  overwrite?: Scalars['Boolean']['input'];
  where?: InputMaybe<DocumentConnectWhere>;
};

export type DocumentParentConnection = {
  __typename?: 'DocumentParentConnection';
  edges: Array<DocumentParentRelationship>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type DocumentParentConnectionSort = {
  node?: InputMaybe<DocumentSort>;
};

export type DocumentParentConnectionWhere = {
  AND?: InputMaybe<Array<DocumentParentConnectionWhere>>;
  NOT?: InputMaybe<DocumentParentConnectionWhere>;
  OR?: InputMaybe<Array<DocumentParentConnectionWhere>>;
  node?: InputMaybe<DocumentWhere>;
};

export type DocumentParentCreateFieldInput = {
  node: DocumentCreateInput;
};

export type DocumentParentDeleteFieldInput = {
  delete?: InputMaybe<DocumentDeleteInput>;
  where?: InputMaybe<DocumentParentConnectionWhere>;
};

export type DocumentParentDisconnectFieldInput = {
  disconnect?: InputMaybe<DocumentDisconnectInput>;
  where?: InputMaybe<DocumentParentConnectionWhere>;
};

export type DocumentParentFieldInput = {
  connect?: InputMaybe<DocumentParentConnectFieldInput>;
  create?: InputMaybe<DocumentParentCreateFieldInput>;
};

export type DocumentParentNodeAggregationWhereInput = {
  AND?: InputMaybe<Array<DocumentParentNodeAggregationWhereInput>>;
  NOT?: InputMaybe<DocumentParentNodeAggregationWhereInput>;
  OR?: InputMaybe<Array<DocumentParentNodeAggregationWhereInput>>;
  content_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_GT?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_LT?: InputMaybe<Scalars['Float']['input']>;
  content_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars['Float']['input']>;
  content_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  content_LONGEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  content_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  createdAt_MAX_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_GT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_LT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MAX_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_GT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_LT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_MIN_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_GT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_LT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MAX_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_GT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_LT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_MIN_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  fileName_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_GT?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_LT?: InputMaybe<Scalars['Float']['input']>;
  fileName_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars['Float']['input']>;
  fileName_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  fileName_LONGEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  fileName_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  updatedAt_MAX_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_GT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_LT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MAX_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_EQUAL?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_GT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_LT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_MIN_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  userId_AVERAGE_LENGTH_EQUAL?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_GT?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_GTE?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_LT?: InputMaybe<Scalars['Float']['input']>;
  userId_AVERAGE_LENGTH_LTE?: InputMaybe<Scalars['Float']['input']>;
  userId_LONGEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  userId_LONGEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_EQUAL?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_GT?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_GTE?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_LT?: InputMaybe<Scalars['Int']['input']>;
  userId_SHORTEST_LENGTH_LTE?: InputMaybe<Scalars['Int']['input']>;
};

export type DocumentParentRelationship = {
  __typename?: 'DocumentParentRelationship';
  cursor: Scalars['String']['output'];
  node: Document;
};

export type DocumentParentUpdateConnectionInput = {
  node?: InputMaybe<DocumentUpdateInput>;
};

export type DocumentParentUpdateFieldInput = {
  connect?: InputMaybe<DocumentParentConnectFieldInput>;
  create?: InputMaybe<DocumentParentCreateFieldInput>;
  delete?: InputMaybe<DocumentParentDeleteFieldInput>;
  disconnect?: InputMaybe<DocumentParentDisconnectFieldInput>;
  update?: InputMaybe<DocumentParentUpdateConnectionInput>;
  where?: InputMaybe<DocumentParentConnectionWhere>;
};

export type DocumentRelationInput = {
  children?: InputMaybe<Array<DocumentChildrenCreateFieldInput>>;
  parent?: InputMaybe<DocumentParentCreateFieldInput>;
};

/** Fields to sort Documents by. The order in which sorts are applied is not guaranteed when specifying many fields in one DocumentSort object. */
export type DocumentSort = {
  content?: InputMaybe<SortDirection>;
  createdAt?: InputMaybe<SortDirection>;
  deletedAt?: InputMaybe<SortDirection>;
  fileName?: InputMaybe<SortDirection>;
  id?: InputMaybe<SortDirection>;
  updatedAt?: InputMaybe<SortDirection>;
  userId?: InputMaybe<SortDirection>;
};

export type DocumentUpdateInput = {
  children?: InputMaybe<Array<DocumentChildrenUpdateFieldInput>>;
  content?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt?: InputMaybe<Scalars['DateTime']['input']>;
  fileName?: InputMaybe<Scalars['String']['input']>;
  parent?: InputMaybe<DocumentParentUpdateFieldInput>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentWhere = {
  AND?: InputMaybe<Array<DocumentWhere>>;
  NOT?: InputMaybe<DocumentWhere>;
  OR?: InputMaybe<Array<DocumentWhere>>;
  childrenAggregate?: InputMaybe<DocumentChildrenAggregateInput>;
  /** Return Documents where all of the related DocumentChildrenConnections match this filter */
  childrenConnection_ALL?: InputMaybe<DocumentChildrenConnectionWhere>;
  /** Return Documents where none of the related DocumentChildrenConnections match this filter */
  childrenConnection_NONE?: InputMaybe<DocumentChildrenConnectionWhere>;
  /** Return Documents where one of the related DocumentChildrenConnections match this filter */
  childrenConnection_SINGLE?: InputMaybe<DocumentChildrenConnectionWhere>;
  /** Return Documents where some of the related DocumentChildrenConnections match this filter */
  childrenConnection_SOME?: InputMaybe<DocumentChildrenConnectionWhere>;
  /** Return Documents where all of the related Documents match this filter */
  children_ALL?: InputMaybe<DocumentWhere>;
  /** Return Documents where none of the related Documents match this filter */
  children_NONE?: InputMaybe<DocumentWhere>;
  /** Return Documents where one of the related Documents match this filter */
  children_SINGLE?: InputMaybe<DocumentWhere>;
  /** Return Documents where some of the related Documents match this filter */
  children_SOME?: InputMaybe<DocumentWhere>;
  content?: InputMaybe<Scalars['String']['input']>;
  content_CONTAINS?: InputMaybe<Scalars['String']['input']>;
  content_ENDS_WITH?: InputMaybe<Scalars['String']['input']>;
  content_IN?: InputMaybe<Array<Scalars['String']['input']>>;
  content_STARTS_WITH?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_GT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_IN?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  createdAt_LT?: InputMaybe<Scalars['DateTime']['input']>;
  createdAt_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_GT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_IN?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  deletedAt_LT?: InputMaybe<Scalars['DateTime']['input']>;
  deletedAt_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  fileName?: InputMaybe<Scalars['String']['input']>;
  fileName_CONTAINS?: InputMaybe<Scalars['String']['input']>;
  fileName_ENDS_WITH?: InputMaybe<Scalars['String']['input']>;
  fileName_IN?: InputMaybe<Array<Scalars['String']['input']>>;
  fileName_STARTS_WITH?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_CONTAINS?: InputMaybe<Scalars['ID']['input']>;
  id_ENDS_WITH?: InputMaybe<Scalars['ID']['input']>;
  id_IN?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_STARTS_WITH?: InputMaybe<Scalars['ID']['input']>;
  parent?: InputMaybe<DocumentWhere>;
  parentAggregate?: InputMaybe<DocumentParentAggregateInput>;
  parentConnection?: InputMaybe<DocumentParentConnectionWhere>;
  parentConnection_NOT?: InputMaybe<DocumentParentConnectionWhere>;
  parent_NOT?: InputMaybe<DocumentWhere>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_GT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_GTE?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_IN?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  updatedAt_LT?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt_LTE?: InputMaybe<Scalars['DateTime']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
  userId_CONTAINS?: InputMaybe<Scalars['String']['input']>;
  userId_ENDS_WITH?: InputMaybe<Scalars['String']['input']>;
  userId_IN?: InputMaybe<Array<Scalars['String']['input']>>;
  userId_STARTS_WITH?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentsConnection = {
  __typename?: 'DocumentsConnection';
  edges: Array<DocumentEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FloatAggregateSelection = {
  __typename?: 'FloatAggregateSelection';
  average?: Maybe<Scalars['Float']['output']>;
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  sum?: Maybe<Scalars['Float']['output']>;
};

export type IdAggregateSelection = {
  __typename?: 'IDAggregateSelection';
  longest?: Maybe<Scalars['ID']['output']>;
  shortest?: Maybe<Scalars['ID']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createDocuments: CreateDocumentsMutationResponse;
  deleteDocuments: DeleteInfo;
  updateDocuments: UpdateDocumentsMutationResponse;
};


export type MutationCreateDocumentsArgs = {
  input: Array<DocumentCreateInput>;
};


export type MutationDeleteDocumentsArgs = {
  delete?: InputMaybe<DocumentDeleteInput>;
  where?: InputMaybe<DocumentWhere>;
};


export type MutationUpdateDocumentsArgs = {
  connect?: InputMaybe<DocumentConnectInput>;
  create?: InputMaybe<DocumentRelationInput>;
  delete?: InputMaybe<DocumentDeleteInput>;
  disconnect?: InputMaybe<DocumentDisconnectInput>;
  update?: InputMaybe<DocumentUpdateInput>;
  where?: InputMaybe<DocumentWhere>;
};

/** Pagination information (Relay) */
export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  documents: Array<Document>;
  documentsAggregate: DocumentAggregateSelection;
  documentsConnection: DocumentsConnection;
};


export type QueryDocumentsArgs = {
  options?: InputMaybe<DocumentOptions>;
  where?: InputMaybe<DocumentWhere>;
};


export type QueryDocumentsAggregateArgs = {
  where?: InputMaybe<DocumentWhere>;
};


export type QueryDocumentsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InputMaybe<DocumentSort>>>;
  where?: InputMaybe<DocumentWhere>;
};

/** An enum for sorting in either ascending or descending order. */
export enum SortDirection {
  /** Sort by field values in ascending order. */
  Asc = 'ASC',
  /** Sort by field values in descending order. */
  Desc = 'DESC'
}

export type StringAggregateSelection = {
  __typename?: 'StringAggregateSelection';
  longest?: Maybe<Scalars['String']['output']>;
  shortest?: Maybe<Scalars['String']['output']>;
};

export type UpdateDocumentsMutationResponse = {
  __typename?: 'UpdateDocumentsMutationResponse';
  documents: Array<Document>;
  info: UpdateInfo;
};

/** Information about the number of nodes and relationships created and deleted during an update mutation */
export type UpdateInfo = {
  __typename?: 'UpdateInfo';
  /** @deprecated This field has been deprecated because bookmarks are now handled by the driver. */
  bookmark?: Maybe<Scalars['String']['output']>;
  nodesCreated: Scalars['Int']['output'];
  nodesDeleted: Scalars['Int']['output'];
  relationshipsCreated: Scalars['Int']['output'];
  relationshipsDeleted: Scalars['Int']['output'];
};

export type GetDocumentsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDocumentsQuery = { __typename?: 'Query', documents: Array<{ __typename?: 'Document', id: string, fileName: string, childrenConnection: { __typename?: 'DocumentChildrenConnection', edges: Array<{ __typename?: 'DocumentChildrenRelationship', node: { __typename?: 'Document', id: string, fileName: string, content: string }, properties: { __typename?: 'ChildOrder', order: number } }> } }> };


export const GetDocumentsDocument = gql`
    query GetDocuments {
  documents {
    id
    fileName
    childrenConnection {
      edges {
        node {
          id
          fileName
          content
        }
        properties {
          order
        }
      }
    }
  }
}
    `;

/**
 * __useGetDocumentsQuery__
 *
 * To run a query within a React component, call `useGetDocumentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDocumentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDocumentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDocumentsQuery(baseOptions?: Apollo.QueryHookOptions<GetDocumentsQuery, GetDocumentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDocumentsQuery, GetDocumentsQueryVariables>(GetDocumentsDocument, options);
      }
export function useGetDocumentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDocumentsQuery, GetDocumentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDocumentsQuery, GetDocumentsQueryVariables>(GetDocumentsDocument, options);
        }
export function useGetDocumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDocumentsQuery, GetDocumentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDocumentsQuery, GetDocumentsQueryVariables>(GetDocumentsDocument, options);
        }
export type GetDocumentsQueryHookResult = ReturnType<typeof useGetDocumentsQuery>;
export type GetDocumentsLazyQueryHookResult = ReturnType<typeof useGetDocumentsLazyQuery>;
export type GetDocumentsSuspenseQueryHookResult = ReturnType<typeof useGetDocumentsSuspenseQuery>;
export type GetDocumentsQueryResult = Apollo.QueryResult<GetDocumentsQuery, GetDocumentsQueryVariables>;