import { Client, Databases, Query } from "node-appwrite";

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const APPWRITE_POSTS_COLLECTION_ID = process.env.APPWRITE_POSTS_COLLECTION_ID;
const APPWRITE_CATEGORIES_COLLECTION_ID =
  process.env.APPWRITE_CATEGORIES_COLLECTION_ID;
const APPWRITE_TAGS_COLLECTION_ID = process.env.APPWRITE_TAGS_COLLECTION_ID;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  throw new Error(
    "APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY must be set.",
  );
}

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

export const databases = new Databases(client);

export interface AppwritePost {
  $id: string;
  clientId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  status: "draft" | "published";
  categoryIds: string[];
  tagIds: string[];
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  $createdAt: string;
  $updatedAt: string;
}

export interface AppwriteCategory {
  $id: string;
  clientId: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  postCount: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface AppwriteTag {
  $id: string;
  clientId: string;
  name: string;
  slug: string;
  postCount: number;
  $createdAt: string;
  $updatedAt: string;
}

export async function getPublishedPostsByClientId(
  clientId: string,
  limit = 20,
  offset = 0,
): Promise<{ posts: AppwritePost[]; total: number }> {
  if (!APPWRITE_DATABASE_ID || !APPWRITE_POSTS_COLLECTION_ID) {
    throw new Error(
      "APPWRITE_DATABASE_ID and APPWRITE_POSTS_COLLECTION_ID must be set.",
    );
  }

  const response = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_POSTS_COLLECTION_ID,
    [
      Query.equal("clientId", clientId),
      // Query.equal("status", "published"),
      Query.limit(limit),
      Query.offset(offset),
    ],
  );

  return {
    posts: response.documents as unknown as AppwritePost[],
    total: response.total,
  };
}

export async function getCategoriesByIds(
  ids: string[],
): Promise<AppwriteCategory[]> {
  if (!APPWRITE_DATABASE_ID || !APPWRITE_CATEGORIES_COLLECTION_ID) {
    throw new Error(
      "APPWRITE_DATABASE_ID and APPWRITE_CATEGORIES_COLLECTION_ID must be set.",
    );
  }

  if (ids.length === 0) {
    return [];
  }

  const response = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_CATEGORIES_COLLECTION_ID,
    [Query.equal("$id", ids), Query.limit(100)],
  );

  return response.documents as unknown as AppwriteCategory[];
}

export async function getTagsByIds(ids: string[]): Promise<AppwriteTag[]> {
  if (!APPWRITE_DATABASE_ID || !APPWRITE_TAGS_COLLECTION_ID) {
    throw new Error(
      "APPWRITE_DATABASE_ID and APPWRITE_TAGS_COLLECTION_ID must be set.",
    );
  }

  if (ids.length === 0) {
    return [];
  }

  const response = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_TAGS_COLLECTION_ID,
    [Query.equal("$id", ids), Query.limit(100)],
  );

  return response.documents as unknown as AppwriteTag[];
}
