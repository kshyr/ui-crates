import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@server/api/trpc";

export const profileRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id }, ctx }) => {
      const profile = await ctx.prisma.user.findUnique({
        where: { id },
        select: {
          name: true,
          image: true,
          _count: {
            select: {
              following: true,
              followedBy: true,
              posts: true,
            },
          },
          followedBy: ctx.session?.user.id
            ? { where: { id: ctx.session.user.id } }
            : undefined,
        },
      });

      if (!profile) return;

      return {
        name: profile.name,
        image: profile.image,
        followersCount: profile._count.followedBy,
        followsCount: profile._count.following,
        postsCount: profile._count.posts,
        isFollowing: profile.followedBy.length > 0,
      };
    }),

  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input: { userId }, ctx }) => {
      const currentUserId = ctx.session.user.id;

      const follow = await ctx.prisma.user.findFirst({
        where: { id: userId, followedBy: { some: { id: currentUserId } } },
      });

      let addedFollow: boolean;

      if (follow) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { followedBy: { disconnect: { id: currentUserId } } },
        });
        addedFollow = true;
      } else {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { followedBy: { connect: { id: currentUserId } } },
        });
        addedFollow = false;
      }

      void ctx.revalidateSSG?.(`/profiles/${userId}`);
      void ctx.revalidateSSG?.(`/profiles/${currentUserId}`);
      return { addedFollow };
    }),
});
