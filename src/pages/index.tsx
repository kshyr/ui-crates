import Header from "@components/Header";
import InfiniteFeed from "@components/InfiniteFeed";
import PostCreationForm from "@components/PostCreationForm";
import { Button } from "@components/ui/button";
import { api } from "@utils/api";
import { type NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <Header title="Home" />
      <PostCreationForm />
      <div className="py-12">
        <GlobalFeed />
      </div>
    </>
  );
};

function GlobalFeed() {
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    {},
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <InfiniteFeed
      posts={posts.data?.pages.flatMap((page) => page.posts)}
      isError={posts.isError}
      isLoading={posts.isLoading}
      hasMore={posts.hasNextPage ?? false}
      fetchNewPosts={posts.fetchNextPage}
    />
  );
}

function FollowingFeed() {
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    { onlyFollowing: true },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  return (
    <InfiniteFeed
      posts={posts.data?.pages.flatMap((page) => page.posts)}
      isError={posts.isError}
      isLoading={posts.isLoading}
      hasMore={posts.hasNextPage ?? false}
      fetchNewPosts={posts.fetchNextPage}
    />
  );
}

export default Home;
