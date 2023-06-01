import { z } from "zod";

import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@server/api/trpc";
import { Prisma } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";

export const postRouter = createTRPCRouter({
  infiniteFeed: publicProcedure
    .input(
      z.object({
        onlyFollowing: z.boolean().optional(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(
      async ({ input: { limit = 10, onlyFollowing = false, cursor }, ctx }) => {
        const currentUserId = ctx.session?.user.id;
        const whereClause =
          currentUserId && onlyFollowing
            ? {
              author: {
                followedBy: { some: { id: currentUserId } },
              },
            }
            : undefined;

        return await getInfinitePosts({ whereClause, limit, cursor, ctx });
      }
    ),
  infiniteProfileFeed: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(async ({ input: { limit = 10, userId, cursor }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      const whereClause = { userId };

      return await getInfinitePosts({ whereClause, limit, cursor, ctx });
    }),

  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx }) => {
      const post = await ctx.prisma.post.create({
        data: { content, userId: ctx.session.user.id },
      });

      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`);
      return post;
    }),

  toggleLike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const data = { userId: ctx.session.user.id, postId: id };
      const like = await ctx.prisma.like.findUnique({
        where: { userId_postId: data },
      });

      if (like) {
        await ctx.prisma.like.delete({
          where: { userId_postId: data },
        });
        return { addedLike: false };
      } else {
        await ctx.prisma.like.create({ data });
        return { addedLike: true };
      }
    }),
});

async function getInfinitePosts({
  whereClause,
  limit = 10,
  cursor,
  ctx,
}: {
  whereClause?: Prisma.PostWhereInput;
  limit: number;
  cursor?: { id: string; createdAt: Date };
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
  const currentUserId = ctx.session?.user.id;

  const posts = await ctx.prisma.post.findMany({
    take: limit + 1,
    cursor: cursor ? { createdAt_id: cursor } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    where: whereClause,
    select: {
      id: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes: currentUserId ? { where: { userId: currentUserId } } : false,
      author: {
        select: {
          name: true,
          id: true,
          image: true,
        },
      },
    },
  });

  let nextCursor: typeof cursor;

  if (posts.length > limit) {
    const nextItem = posts.pop();
    if (nextItem) {
      nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt };
    }
  }

  return {
    posts: posts.map((post) => {
      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        likeCount: post._count.likes,
        author: post.author,
        likedByUser: post.likes?.length > 0,
      };
    }),
    nextCursor,
  };
}
