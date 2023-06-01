import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode, MdArrowBack } from "react-icons/md";
import { Button } from "./ui/button";
import Link from "next/link";

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

type HeaderProps = {
  title: string;
  isNested?: boolean;
};

export default function Header({ title, isNested }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex border-b bg-background p-2">
      {isNested && (
        <Link href="..">
          <Button variant="outline">
            <MdArrowBack className="h-5 w-5" />
          </Button>
        </Link>
      )}

      <h1 className="mb-2 px-4 text-lg font-bold">{title}</h1>
      <ThemeSwitch />
    </header>
  );
}
