import { Zap, Shield, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Zap,
    title: 'Незабавна Доставка',
    description:
      'Получете вашите V-Bucks в рамките на минути след покупката. Без чакане, без забавяния.',
  },
  {
    icon: Shield,
    title: '100% Сигурност',
    description:
      'Защитени транзакции с водещи в индустрията стандарти за сигурност.',
  },
  {
    icon: CreditCard,
    title: 'Най-добри Цени',
    description: 'Конкурентни цени с редовни отстъпки и специални оферти.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4" style={{ backgroundColor: '#36213e' }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#f6f7f8' }}>
          Защо да Изберете Нас?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-8 rounded-2xl border-2 transition-all hover:scale-[1.02] hover:border-[rgba(255,51,102,0.45)]"
              style={{
                backgroundColor: '#011627',
                borderColor: 'rgba(255, 51, 102, 0.2)',
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: 'rgba(255, 51, 102, 0.15)' }}
              >
                <Icon className="w-8 h-8" style={{ color: '#ff3366' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#f6f7f8' }}>
                {title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
