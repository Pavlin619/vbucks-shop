import Image from 'next/image';

/**
 * Top hero block on the home page. A full-bleed banner image sits behind a
 * layered linear gradient overlay (inline `style` is justified — it's a
 * multi-stop gradient that's awkward as a Tailwind utility) that fades the
 * artwork into the page background. The overlay colors mirror the Figma
 * design's brand-dark stops.
 */
export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(1,22,39,0.3), rgba(1,22,39,0.5), rgba(1,22,39,1))',
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg text-brand-text">
          Fortnite V-Bucks
        </h1>
        <p className="text-xl md:text-2xl mb-10 drop-shadow-md text-brand-text">
          V-Bucks ПРОМОЦИЙКА с до -51% намаление на избрани пакети
        </p>
        <a
          href="#packages"
          className="inline-block text-lg px-10 py-4 rounded-full font-semibold transition-colors bg-brand-accent text-brand-text hover:bg-brand-accent-hover shadow-xl"
        >
          Разгледай Пакетите
        </a>
      </div>
    </section>
  );
}
