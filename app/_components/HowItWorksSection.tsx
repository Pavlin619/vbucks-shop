import SectionHeading from '@/components/ui/SectionHeading';

const STEPS = [
  {
    number: '1',
    title: 'Изберете Пакет',
    description: 'Изберете количеството V-Bucks, което отговаря на вашите нужди',
  },
  {
    number: '2',
    title: 'Завършете Плащането',
    description: 'Сигурна поръчка с множество опции за плащане',
  },
  {
    number: '3',
    title: 'Получете Незабавно',
    description: 'Получете вашите V-Bucks доставени до вашия акаунт',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-brand-purple">
      <div className="max-w-5xl mx-auto">
        <SectionHeading title="Как Работи" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ number, title, description }) => (
            <div key={number} className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 bg-brand-accent text-brand-text">
                {number}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-brand-text">{title}</h3>
              <p className="text-brand-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
