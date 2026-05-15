import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000';

  return [
    {
      url: base,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      // The item shop refreshes every day at midnight UTC — tell Google to
      // re-crawl daily so newly available skins appear in search quickly.
      url: `${base}/item-shop`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/contact`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/privacy-policy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${base}/terms-of-use`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${base}/refund-policy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
