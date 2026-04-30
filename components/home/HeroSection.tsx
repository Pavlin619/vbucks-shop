export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Dark gaming gradient background.
          To use actual artwork: add your image to public/images/hero-bg.jpg
          and replace this div with <Image src="/images/hero-bg.jpg" fill className="object-cover" alt="" /> */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 65%, #36213e 0%, #1a0a2e 40%, #011627 100%)',
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
        <h1
          className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg"
          style={{ color: '#f6f7f8' }}
        >
          Fortnite V-Bucks
        </h1>
        <p className="text-xl md:text-2xl mb-10 drop-shadow-md" style={{ color: '#f6f7f8' }}>
          V-Bucks ПРОМОЦИЙКА с до -51% намаление на избрани пакети
        </p>
        <a
          href="#packages"
          className="inline-block text-lg px-10 py-4 rounded-full font-semibold transition-all hover:scale-105 hover:bg-[#e62958] shadow-xl"
          style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
        >
          Разгледай Пакетите
        </a>
      </div>
    </section>
  );
}
