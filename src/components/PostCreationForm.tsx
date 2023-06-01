import { api } from "@utils/api";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import Link from "next/link";

export default function PostCreationForm() {
  const session = useSession();

  if (session.status !== "authenticated") return null;

  return <Form image={session.data.user.image as string} />;
}

function useGrowableTextArea(inputValue: string) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    textArea.style.height = "0";
    textArea.style.height = `${textArea.scrollHeight}px`;
  }, [inputValue, textAreaRef]);

  return textAreaRef;
}

function Form({ image }: { image: string }) {
  const [inputValue, setInputValue] = useState("");
  const trpcUtils = api.useContext();
  const textArea = useGrowableTextArea(inputValue);
  const session = useSession();

  const createPost = api.post.create.useMutation({
    onSuccess: (newPost) => {
      if (session.status !== "authenticated") return;

      setInputValue("");

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    createPost.mutate({ content: inputValue });
  }

  return (
    <div className="flex items-center justify-center border-b">
      <form
        onSubmit={handleSubmit}
        className=" flex w-2/5 flex-col gap-2 border-x px-4 py-2"
      >
        {session.data?.user && (
          <Link href={`/u/${session.data.user.id}`}>
            <Image src={image} width={40} height={40} alt="userImg" />
          </Link>
        )}
        <div className="flex gap-4">
          <Textarea
            ref={textArea}
            className="bg-base-300 flex-grow resize-none overflow-hidden p-4 text-lg"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          ></Textarea>
        </div>
        <Button type="submit" className="ml-auto text-lg font-bold">
          Post
        </Button>
      </form>
    </div>
  );
}
