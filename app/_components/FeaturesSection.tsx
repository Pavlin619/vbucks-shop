import { Zap, Shield, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';

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
    <section id="features" className="py-20 px-4 bg-brand-purple">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title="Защо да Изберете Нас?" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-8 rounded-2xl border-2 transition-all hover:scale-[1.02] bg-brand-dark border-brand-border hover:border-brand-border-strong"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-brand-accent/15">
                <Icon className="w-8 h-8 text-brand-accent" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-brand-text">{title}</h3>
              <p className="text-brand-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
