import { Client, Databases, Query } from "node-appwrite";

// Environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const APPWRITE_POSTS_COLLECTION_ID = process.env.APPWRITE_POSTS_COLLECTION_ID!;
const APPWRITE_CATEGORIES_COLLECTION_ID =
  process.env.APPWRITE_CATEGORIES_COLLECTION_ID!;
const APPWRITE_TAGS_COLLECTION_ID = process.env.APPWRITE_TAGS_COLLECTION_ID!;

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// Types
interface AppwritePost {
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

interface AppwriteCategory {
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

interface AppwriteTag {
  $id: string;
  clientId: string;
  name: string;
  slug: string;
  postCount: number;
  $createdAt: string;
  $updatedAt: string;
}

// Helper functions
async function getPublishedPostsByClientId(
  clientId: string,
  limit = 20,
  offset = 0,
): Promise<{ posts: AppwritePost[]; total: number }> {
  const response = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_POSTS_COLLECTION_ID,
    [
      Query.equal("clientId", clientId),
      Query.limit(limit),
      Query.offset(offset),
    ],
  );

  return {
    posts: response.documents as unknown as AppwritePost[],
    total: response.total,
  };
}

async function getCategoriesByIds(ids: string[]): Promise<AppwriteCategory[]> {
  if (ids.length === 0) return [];

  const response = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_CATEGORIES_COLLECTION_ID,
    [Query.equal("$id", ids), Query.limit(100)],
  );

  return response.documents as unknown as AppwriteCategory[];
}

async function getTagsByIds(ids: string[]): Promise<AppwriteTag[]> {
  if (ids.length === 0) return [];

  const response = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_TAGS_COLLECTION_ID,
    [Query.equal("$id", ids), Query.limit(100)],
  );

  return response.documents as unknown as AppwriteTag[];
}

// Main Appwrite function handler
export default async ({ req, res, log, error }: any) => {
  const path = req.path || "/";
  const method = req.method;

  log(`${method} ${path}`);

  // Health check endpoint
  if (path === "/healthz" || path === "/api/healthz") {
    return res.json({ status: "ok" });
  }

  // Posts endpoint
  if ((path === "/posts" || path === "/api/posts") && method === "GET") {
    try {
      const clientId =
        req.query?.clientId ||
        req.queryString?.split("clientId=")[1]?.split("&")[0];
      const limit = parseInt(req.query?.limit || "20");
      const offset = parseInt(req.query?.offset || "0");

      if (!clientId) {
        return res.json(
          {
            error: "bad_request",
            message: "clientId is required",
          },
          400,
        );
      }

      const { posts, total } = await getPublishedPostsByClientId(
        clientId,
        limit,
        offset,
      );

      // Collect all unique category and tag IDs
      const allCategoryIds = new Set<string>();
      const allTagIds = new Set<string>();

      posts.forEach((post) => {
        post.categoryIds.forEach((id) => allCategoryIds.add(id));
        post.tagIds.forEach((id) => allTagIds.add(id));
      });

      // Fetch all categories and tags in parallel
      const [categories, tags] = await Promise.all([
        getCategoriesByIds(Array.from(allCategoryIds)),
        getTagsByIds(Array.from(allTagIds)),
      ]);

      // Create lookup maps
      const categoryMap = new Map(
        categories.map((cat) => [
          cat.$id,
          {
            id: cat.$id,
            clientId: cat.clientId,
            name: cat.name,
            slug: cat.slug,
            description: cat.description ?? null,
            color: cat.color ?? null,
            postCount: cat.postCount,
            createdAt: cat.$createdAt,
            updatedAt: cat.$updatedAt,
          },
        ]),
      );

      const tagMap = new Map(
        tags.map((tag) => [
          tag.$id,
          {
            id: tag.$id,
            clientId: tag.clientId,
            name: tag.name,
            slug: tag.slug,
            postCount: tag.postCount,
            createdAt: tag.$createdAt,
            updatedAt: tag.$updatedAt,
          },
        ]),
      );

      const publicPosts = posts.map((post) => ({
        id: post.$id,
        clientId: post.clientId,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt ?? null,
        status: post.status,
        categories: post.categoryIds
          .map((id) => categoryMap.get(id))
          .filter((cat) => cat !== undefined),
        tags: post.tagIds
          .map((id) => tagMap.get(id))
          .filter((tag) => tag !== undefined),
        featuredImage: post.featuredImage ?? null,
        metaTitle: post.metaTitle ?? null,
        metaDescription: post.metaDescription ?? null,
        publishedAt: post.publishedAt ?? null,
        createdAt: post.$createdAt,
        updatedAt: post.$updatedAt,
      }));

      return res.json({
        posts: publicPosts,
        total,
        clientId,
      });
    } catch (err) {
      error("Failed to fetch posts from Appwrite:", err);
      return res.json(
        {
          error: "internal_error",
          message: "Failed to fetch posts",
        },
        500,
      );
    }
  }

  // Default response
  return res.send(
    "<h1>Welcome to the Blog CMS API</h1><p>Available endpoints: /api/healthz, /api/posts</p>",
    200,
    { "Content-Type": "text/html" },
  );
};
