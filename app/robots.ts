import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/profile', '/onboarding'],
    },
    sitemap: 'https://promociika.com/sitemap.xml',
  };
}
