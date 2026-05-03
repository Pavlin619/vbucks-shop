/**
 * Top hero block on the home page. The radial + linear gradient
 * decoration is an inline `style` (justified — it's a layered multi-stop
 * gradient that's awkward to express as a Tailwind utility), but the
 * brand colors are referenced through CSS variables so the @theme palette
 * remains the single source of truth.
 *
 * To use real artwork instead of the gradient: drop your image into
 * `public/images/hero-bg.jpg` and replace the first decorative div with
 * `<Image src="/images/hero-bg.jpg" fill className="object-cover" alt="" />`.
 */
export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          // `#1a0a2e` is an aesthetic mid-stop unique to this gradient and
          // intentionally not promoted to a brand token.
          background:
            'radial-gradient(ellipse at 50% 65%, var(--color-brand-purple) 0%, #1a0a2e 40%, var(--color-brand-dark) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(1,22,39,0.2), rgba(1,22,39,0.4), rgba(1,22,39,0.95))',
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
