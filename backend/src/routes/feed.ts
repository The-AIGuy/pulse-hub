import { Router } from "express";
import { PostModel } from "../models/Schemas.js";

const feedRouter = Router();

feedRouter.get("/feed", async (request, response) => {
  const requestedLimit = Number(request.query.limit ?? 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 10;
  const cursor = typeof request.query.cursor === "string" ? request.query.cursor : undefined;

  if (cursor && Number.isNaN(Date.parse(cursor))) {
    response.status(400).json({ error: "cursor must be a valid ISO timestamp" });
    return;
  }

  try {
    const posts = await PostModel.find(cursor ? { timestamp: { $lt: new Date(cursor) } } : {})
      .select("author caption timestamp mediaUrls likes reactions comments")
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasNextPage = posts.length > limit;
    const items = hasNextPage ? posts.slice(0, limit) : posts;
    const lastPost = items.at(-1);

    response.json({
      items,
      nextCursor: hasNextPage && lastPost ? lastPost.timestamp.toISOString() : null,
    });
  } catch (error: unknown) {
    console.error("Failed to load feed", error);
    response.status(500).json({ error: "Failed to load feed" });
  }
});

feedRouter.post("/", async (request, response) => {
  const { author, caption = "", mediaUrls = [] } = request.body as {
    author?: string;
    caption?: string;
    mediaUrls?: string[];
  };

  if (!author || !caption.trim() || !Array.isArray(mediaUrls)) {
    response.status(400).json({ error: "author, caption, and mediaUrls are required" });
    return;
  }

  try {
    const post = await PostModel.create({ author, caption: caption.trim(), mediaUrls });
    response.status(201).json(post);
  } catch (error: unknown) {
    console.error("Failed to create post", error);
    response.status(500).json({ error: "Failed to create post" });
  }
});

feedRouter.post("/:postId/react", async (request, response) => {
  const { userId, type = "like" } = request.body as { userId?: string; type?: string };
  const allowedTypes = ["like", "love", "laugh", "wow"];

  if (!userId || !allowedTypes.includes(type)) {
    response.status(400).json({ error: "userId and a valid reaction type are required" });
    return;
  }

  try {
    const post = await PostModel.findById(request.params.postId);
    if (!post) {
      response.status(404).json({ error: "Post not found" });
      return;
    }

    post.reactions = post.reactions.filter((reaction) => reaction.user.toString() !== userId);
    post.reactions.push({ user: userId as never, type: type as "like" | "love" | "laugh" | "wow" });
    await post.save();
    response.json(post);
  } catch (error: unknown) {
    console.error("Failed to react to post", error);
    response.status(500).json({ error: "Failed to react to post" });
  }
});

feedRouter.post("/:postId/comments", async (request, response) => {
  const { author, text } = request.body as { author?: string; text?: string };

  if (!author || !text?.trim()) {
    response.status(400).json({ error: "author and text are required" });
    return;
  }

  try {
    const post = await PostModel.findByIdAndUpdate(
      request.params.postId,
      { $push: { comments: { author, text: text.trim(), mentions: [...text.matchAll(/@\[([\w.-]+)\]/g)].map((match) => match[1]) } } },
      { new: true, runValidators: true },
    );

    if (!post) {
      response.status(404).json({ error: "Post not found" });
      return;
    }

    response.status(201).json(post.comments.at(-1));
  } catch (error: unknown) {
    console.error("Failed to add comment", error);
    response.status(500).json({ error: "Failed to add comment" });
  }
});

export default feedRouter;