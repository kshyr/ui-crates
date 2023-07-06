import { signIn, useSession } from "next-auth/react";
import InfiniteScroll from "react-infinite-scroll-component";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { api } from "@utils/api";
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { freeCodeCampDark } from "@codesandbox/sandpack-themes";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { useState } from "react";
import { useTheme } from "next-themes";
import { MdCode, MdCodeOff } from "react-icons/md";

type InfiniteFeedProps = {
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  fetchNewPosts: () => Promise<unknown>;
  posts?: Post[];
};

type Post = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByUser: boolean;
  author: {
    id: string;
    image: string | null;
    name: string | null;
  };
};

export default function InfiniteFeed({
  posts,
  isError,
  isLoading,
  hasMore,
  fetchNewPosts,
}: InfiniteFeedProps) {
  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h1>Error...</h1>;
  if (!posts) return null;
  if (posts.length === 0) return <h1>0 posts</h1>;

  return (
    <InfiniteScroll
      className="relative flex-1"
      dataLength={posts.length}
      next={fetchNewPosts}
      hasMore={hasMore}
      loader={"Loading........."}
    >
      <ul className="flex h-full w-full flex-col items-center justify-center gap-4 ">
        {posts.map((post) => {
          return <PostCard key={post.id} post={post} />;
        })}
      </ul>
    </InfiniteScroll>
  );
}

function PostCard({ post }: { post: Post }) {
  const { theme } = useTheme();
  const [showEditor, setShowEditor] = useState(false);
  const trpcUtils = api.useContext();
  const id = post.id;
  const toggleLike = api.post.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updateData: Parameters<
        typeof trpcUtils.post.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (!oldData) return;

        const countModifier = addedLike ? 1 : -1;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              posts: page.posts.map((post) => {
                if (post.id === id) {
                  return {
                    ...post,
                    likeCount: post.likeCount + countModifier,
                    likedByUser: addedLike,
                  };
                }

                return post;
              }),
            };
          }),
        };
      };

      trpcUtils.post.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.post.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData
      );
      trpcUtils.post.infiniteProfileFeed.setInfiniteData(
        { userId: post.author.id },
        updateData
      );
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id });
  }

  return (
    <Card key={id} className="w-1/2 border bg-card shadow-lg">
      <CardHeader className="flex flex-row items-center py-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post?.author?.image as string} />
          </Avatar>
          <h3 className="text-lg font-semibold">{post.author.name}</h3>
        </div>
        <Badge variant="outline" className="ml-auto">
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: "full",
          }).format(post.createdAt)}
        </Badge>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <p className="whitespace-pre-wrap">
          <SandpackProvider
            files={{
              "/index.html": post.content,
            }}
            theme={freeCodeCampDark}
            template="static"
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
              initMode: "immediate",
              skipEval: true,
            }}
          >
            <SandpackLayout style={{ aspectRatio: "1 / 1", borderRadius: 8 }}>
              {showEditor && (
                <SandpackCodeEditor
                  style={{
                    height: "100%",
                    position: "absolute",
                    zIndex: 1,
                  }}
                  readOnly
                  showReadOnly={false}
                  closableTabs
                  extensions={[autocompletion()]}
                  /* @ts-expect-error KeyBinding[] */
                  extensionsKeymap={[completionKeymap]}
                />
              )}
              <SandpackPreview
                style={{ height: "100%" }}
                showOpenInCodeSandbox={false}
                showRefreshButton={false}
                showRestartButton={false}
              />
            </SandpackLayout>
          </SandpackProvider>
        </p>
      </CardContent>
      <CardFooter>
        <LikeButton
          isLoading={toggleLike.isLoading}
          handleToggleLike={handleToggleLike}
          likeCount={post.likeCount}
          likedByUser={post.likedByUser}
        />
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => setShowEditor(!showEditor)}
        >
          {showEditor ? <MdCodeOff /> : <MdCode />}
        </Button>
      </CardFooter>
    </Card>
  );
}

type LikeButtonProps = {
  handleToggleLike: () => void;
  isLoading: boolean;
  likeCount: number;
  likedByUser: boolean;
};
function LikeButton({
  handleToggleLike,
  isLoading,
  likeCount,
  likedByUser,
}: LikeButtonProps) {
  const session = useSession();

  return (
    <Button
      disabled={isLoading}
      size="sm"
      variant="outline"
      className={cn(likedByUser && "[&>svg]:fill-red-400", "flex gap-1")}
      onClick={() => {
        console.log(likedByUser);
        if (session.status !== "authenticated") void signIn();
        else handleToggleLike();
      }}
    >
      {likeCount} {likedByUser ? <VscHeartFilled /> : <VscHeart />}
    </Button>
  );
}
