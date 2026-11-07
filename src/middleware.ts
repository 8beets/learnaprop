import { defineMiddleware } from 'astro:middleware';
import { withPageCache } from './lib/http/page-cache';

export const onRequest = defineMiddleware((context, next) =>
  withPageCache(context.request, next, {
    // Development must reflect code and local data changes immediately.
    cache: import.meta.env.DEV
      ? undefined
      : (caches as CacheStorage & { default: Cache }).default,
    waitUntil: (promise) => context.locals.cfContext.waitUntil(promise),
    hasSetCookies: () => !context.cookies.headers().next().done,
  }),
);
