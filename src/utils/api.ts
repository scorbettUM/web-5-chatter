/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */

import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { wsLink, createWSClient } from '@trpc/client/links/wsLink';
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type NextPageContext } from 'next';
import getConfig from 'next/config';
import superjson from "superjson";
import { type AppRouter } from "server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};


const getBaseWebsocketUrl = () => {

  const { publicRuntimeConfig } = getConfig() as {
    publicRuntimeConfig: Record<string, string>
  };

  const { WS_URL } = publicRuntimeConfig;

  return `ws://${WS_URL}`; // dev SSR should use localhost
};



function getEndingLink(ctx: NextPageContext | undefined) {


  const WS_URL = getBaseWebsocketUrl();

  if (typeof window === 'undefined') {

    const APP_URL = getBaseUrl();

    return httpBatchLink({
      url: `${APP_URL}/api/trpc`,
      headers() {
        if (!ctx?.req?.headers) {
          return {};
        }
        // on ssr, forward client's headers to the server
        return {
          ...ctx.req.headers,
          'x-ssr': '1',
        };
      },
    });
  }
  const client = createWSClient({
    url: WS_URL,
  });
  return wsLink<AppRouter>({
    client,
  });
}


/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        getEndingLink(ctx),
      ],
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: true,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
