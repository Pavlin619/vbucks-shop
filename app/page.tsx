import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/app/_components/HeroSection';
import FeaturesSection from '@/app/_components/FeaturesSection';
import PackagesSection from '@/app/_components/PackagesSection';
import HowItWorksSection from '@/app/_components/HowItWorksSection';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://promociika.com/#organization',
      name: 'Promociika',
      url: 'https://promociika.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://promociika.com/vbucks-coin.jpg',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'jasonbourne@promociika.com',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://promociika.com/#website',
      url: 'https://promociika.com',
      name: 'Promociika',
      publisher: { '@id': 'https://promociika.com/#organization' },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PackagesSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </>
  );
}
