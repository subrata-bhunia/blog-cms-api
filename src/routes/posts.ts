import { Router, type IRouter } from "express";
import {
  getPublishedPostsByClientId,
  getCategoriesByIds,
  getTagsByIds,
} from "../lib/appwrite.js";
import { GetPublicPostsQueryParams } from "../validation/generated/api.js";

const router: IRouter = Router();

router.get("/posts", async (req, res) => {
  const parseResult = GetPublicPostsQueryParams.safeParse(req.query);

  if (!parseResult.success) {
    res.status(400).json({
      error: "bad_request",
      message: "clientId is required",
    });
    return;
  }

  const { clientId, limit = 20, offset = 0 } = parseResult.data;

  try {
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

    // Create lookup maps for quick access
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

    res.json({
      posts: publicPosts,
      total,
      clientId,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch posts from Appwrite");
    res.status(500).json({
      error: "internal_error",
      message: "Failed to fetch posts",
    });
  }
});

export default router;
