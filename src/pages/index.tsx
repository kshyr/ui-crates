import InfiniteFeed from "@components/InfiniteFeed";
import PostCreationForm from "@components/PostCreationForm";
import { Button } from "@components/ui/button";
import { api } from "@utils/api";
import { type NextPage } from "next";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode } from "react-icons/md";

function ThemeSwitch() {
  const { systemTheme, theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string | undefined>();

  useEffect(() => {
    setCurrentTheme(theme === "system" ? systemTheme : theme);
  }, [systemTheme, theme]);
  const isDarkMode = currentTheme === "dark";

  if (!currentTheme) return null;

  const iconStyles = { className: "w-6 h-6" };
  return (
    <Button
      className="ml-auto px-2"
      variant="ghost"
      onClick={() => (isDarkMode ? setTheme("light") : setTheme("dark"))}
    >
      {isDarkMode ? (
        <MdLightMode {...iconStyles} />
      ) : (
        <MdDarkMode {...iconStyles} />
      )}
    </Button>
  );
}

const Home: NextPage = () => {
  return (
    <>
      <header className="sticky top-0 z-10 flex border-b bg-background p-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
        <ThemeSwitch />
      </header>

      <PostCreationForm />
      <div className="flex w-full">
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
