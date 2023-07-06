import {
  CodeEditorRef,
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useActiveCode,
} from "@codesandbox/sandpack-react";
import dynamic from "next/dynamic";
import AceEditor from "react-ace";
import { freeCodeCampDark } from "@codesandbox/sandpack-themes";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import "@uiw/react-textarea-code-editor/dist.css";
import { useSession } from "next-auth/react";
import { api } from "@utils/api";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

const tailwindTemplate = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#2a2a40]">
</body>
</html>`;

export default function PostCreationDialog() {
  const [inputValue, setInputValue] = useState(tailwindTemplate);
  const session = useSession();
  const trpcUtils = api.useContext();

  const createPost = api.post.create.useMutation({
    onSuccess: (newPost) => {
      if (session.status !== "authenticated") return;

      setInputValue(tailwindTemplate);

      trpcUtils.post.infiniteFeed.setInfiniteData({}, (oldData) => {
        if (!oldData || !oldData.pages[0]) return;

        const newCachedPost = {
          ...newPost,
          likeCount: 0,
          likedByUser: false,
          author: {
            id: session.data.user.id,
            name: session.data.user.name || null,
            image: session.data.user.image || null,
          },
        };

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              posts: [newCachedPost, ...oldData.pages[0].posts],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger className="absolute right-4 top-4 h-10 w-20 rounded-lg bg-primary text-lg font-bold text-primary-foreground">
        New
      </DialogTrigger>
      <DialogContent className="min-w-[33rem] md:min-w-[45rem] lg:min-w-[65rem]">
        <SandpackProvider
          files={{
            "/index.html": inputValue,
          }}
          theme={freeCodeCampDark}
          template="static"
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
            initMode: "immediate",
            skipEval: true,
          }}
        >
          <SandpackLayout className="flex h-[70rem] w-[30rem] flex-col md:w-[42rem] lg:w-[62rem] lg:flex-row">
            <CodeEditor
              value={inputValue}
              language="html"
              onChange={(e) => setInputValue(e.target.value)}
              padding={15}
              style={{
                fontSize: 12,
                color: "#fefefe",
                filter: "brightness(2) contrast(0.8)",
                height: "25rem",
                backgroundColor: "var(--background)",
                fontFamily:
                  "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
              }}
            />
            <SandpackPreview
              className=""
              style={{ height: "100%" }}
              showOpenInCodeSandbox={false}
              showRefreshButton={false}
              showRestartButton={false}
            />
          </SandpackLayout>
        </SandpackProvider>
        <Button
          className="text-lg font-bold"
          onClick={() => {
            createPost.mutate({ content: inputValue });
          }}
        >
          Post
        </Button>
      </DialogContent>
    </Dialog>
  );
}
