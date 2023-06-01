import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { useParams } from "next/navigation";
import Head from "next/head";
import ErrorPage from "next/error";
import { ssgHelper } from "@server/api/ssgHelper";
import { api } from "@utils/api";
import Link from "next/link";
import InfiniteFeed from "@components/InfiniteFeed";
import { Button } from "@components/ui/button";
import { useSession } from "next-auth/react";

const UserPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  const { data: profile } = api.profile.getById.useQuery({ id });
  const posts = api.post.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  const trpcUtils = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcUtils.profile.getById.setData({ id }, (oldData) => {
        if (!oldData) return;

        const countModifier = addedFollow ? 1 : -1;

        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: oldData.followersCount + countModifier,
        };
      });
    },
  });

  if (!profile || !profile.name) return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{`${profile.name}`}</title>
      </Head>
      <Link href="..">Back</Link>
      <FollowButton
        userId={id}
        isLoading={toggleFollow.isLoading}
        isFollowing={profile.isFollowing}
        handleFollow={() => toggleFollow.mutate({ userId: id })}
      />
      <h1>{profile.name}</h1>
      <h2>
        {profile.postsCount} {profile.postsCount === 1 ? "crate" : "crates"}{" "}
        {profile.followersCount}{" "}
        {profile.followersCount === 1 ? "follower" : "followers"}{" "}
        {profile.followsCount} following
      </h2>
      <InfiniteFeed
        posts={posts.data?.pages.flatMap((page) => page.posts)}
        isError={posts.isError}
        isLoading={posts.isLoading}
        hasMore={posts.hasNextPage ?? false}
        fetchNewPosts={posts.fetchNextPage}
      />
    </>
  );
};

type FollowButtonProps = {
  userId: string;
  isLoading: boolean;
  isFollowing: boolean;
  handleFollow: () => void;
};

function FollowButton({
  userId,
  isLoading,
  isFollowing,
  handleFollow,
}: FollowButtonProps) {
  const session = useSession();

  if (session.status !== "authenticated" || session.data.user.id === userId) {
    return null;
  }

  return (
    <Button disabled={isLoading} onClick={() => handleFollow()}>
      {isFollowing ? "UnFollow" : "Follow"}
    </Button>
  );
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>
) {
  const id = context.params?.id;

  if (!id) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const ssg = ssgHelper();
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      id,
      trpcState: ssg.dehydrate(),
    },
  };
}
export default UserPage;
