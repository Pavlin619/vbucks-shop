import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Promociika',
    short_name: 'Promociika',
    description: 'Купи V-Bucks и Fortnite скинове',
    start_url: '/',
    display: 'browser',
    background_color: '#011627',
    theme_color: '#ff3366',
    icons: [
      {
        src: '/vbucks-coin.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
    ],
  };
}
