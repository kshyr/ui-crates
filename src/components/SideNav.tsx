import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";

export default function SideNav() {
  const session = useSession();
  const user = session.data?.user;

  return (
    <nav className="sticky top-0 px-2 py-4">
      <ul className="flex flex-col gap-3">
        <li>
          <Link href="/">Home</Link>
        </li>
        {user && (
          <li>
            <Link href={`/profiles/${user.id}`}>Profile</Link>
          </li>
        )}
        {user ? <Logout /> : <Login />}
      </ul>
    </nav>
  );
}

function Logout() {
  return (
    <Button
      onClick={() => void signOut()}
      size="sm"
      className="whitespace-nowrap"
    >
      Log out
    </Button>
  );
}

function Login() {
  return (
    <Button
      onClick={() => void signIn()}
      size="sm"
      className="whitespace-nowrap"
    >
      Log in
    </Button>
  );
}
