import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/app/_components/HeroSection';
import FeaturesSection from '@/app/_components/FeaturesSection';
import PackagesSection from '@/app/_components/PackagesSection';
import HowItWorksSection from '@/app/_components/HowItWorksSection';

export const metadata: Metadata = {
  title: {
    absolute: 'VBucks Shop',
  },
  description: 'Купувай V-Bucks с реални пари и поръчвай Fortnite скинове директно от Item Shop.',
  openGraph: {
    title: 'VBucks Shop',
    description: 'Купувай V-Bucks с реални пари и поръчвай Fortnite скинове директно от Item Shop.',
    url: '/',
  },
};

export default function Home() {
  return (
    <>
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
