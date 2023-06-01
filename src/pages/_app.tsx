import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { api } from "@utils/api";

import "@styles/globals.css";
import Head from "next/head";
import SideNav from "@components/SideNav";
import { ThemeProvider } from "next-themes";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider enableSystem={true} defaultTheme="dark" attribute="class">
        <Head>
          <title>UI-crates</title>
          <meta
            name="description"
            content="Social media platform for sharing UI components."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="container mx-auto flex items-start">
          <SideNav />
          <div className="min-h-screen flex-grow border-x ">
            <Component {...pageProps} />
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
