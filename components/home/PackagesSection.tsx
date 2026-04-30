import type { VBucksPack } from '@/types';

const VBUCKS_PACKS: VBucksPack[] = [
  { id: '500', vbucks: 500, price_cents: 299, label: '500 V-Bucks' },
  { id: '1000', vbucks: 1000, price_cents: 499, label: '1000 V-Bucks' },
  { id: '1500', vbucks: 1500, price_cents: 699, label: '1500 V-Bucks', popular: true },
  { id: '2800', vbucks: 2800, price_cents: 1149, label: '2800 V-Bucks' },
  { id: '5000', vbucks: 5000, price_cents: 1799, label: '5000 V-Bucks' },
];

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function PackagesSection() {
  return (
    <section id="packages" className="py-20 px-4" style={{ backgroundColor: '#011627' }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4" style={{ color: '#f6f7f8' }}>
          Изберете Вашия Пакет
        </h2>
        <p className="text-center text-gray-400 mb-16 text-lg">
          Изберете перфектната сума за вашите гейминг нужди
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {VBUCKS_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="relative rounded-2xl p-8 border-2 transition-all hover:scale-105"
              style={{
                backgroundColor: '#36213e',
                borderColor: pack.popular ? '#ff3366' : 'rgba(1, 22, 39, 0.8)',
                boxShadow: pack.popular
                  ? '0 20px 25px -5px rgba(255, 51, 102, 0.2)'
                  : 'none',
              }}
            >
              {pack.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap"
                  style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
                >
                  Най-популярен
                </div>
              )}

              <div className="text-center">
                <div className="text-5xl font-bold mb-2" style={{ color: '#f6f7f8' }}>
                  {pack.vbucks.toLocaleString()}
                </div>
                <div className="text-gray-400 mb-6">V-Bucks</div>
                <div className="text-3xl font-bold mb-8" style={{ color: '#ff3366' }}>
                  {formatPrice(pack.price_cents)}
                </div>

                <button
                  className="w-full py-3 rounded-full font-semibold transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: pack.popular ? '#ff3366' : '#011627',
                    color: '#f6f7f8',
                  }}
                >
                  Купи Сега
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
