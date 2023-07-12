// @ts-nocheck
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");
import removeImports from "next-remove-imports";

/** @type {import("next").NextConfig} */
const config = removeImports({
  reactStrictMode: true,
  images: { domains: ["cdn.discordapp.com"] },
  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  experimental: { esmExternals: true },
});

export default config;
