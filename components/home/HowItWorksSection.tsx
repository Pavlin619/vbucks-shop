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
    <section
      id="how-it-works"
      className="py-20 px-4"
      style={{ backgroundColor: '#36213e' }}
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#f6f7f8' }}>
          Как Работи
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ number, title, description }) => (
            <div key={number} className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6"
                style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
              >
                {number}
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#f6f7f8' }}>
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
