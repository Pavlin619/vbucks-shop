import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep auth, admin, profile, checkout, and API routes out of the index.
      // These either require login (useless in search results) or are
      // infrastructure endpoints that should never be crawled.
      disallow: ['/admin', '/profile', '/sign-in', '/sign-up', '/checkout', '/api/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
