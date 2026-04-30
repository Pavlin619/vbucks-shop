import { Zap } from 'lucide-react';

const QUICK_LINKS = ['За Нас', 'Контакт', 'ЧЗВ'];
const LEGAL_LINKS = ['Условия за Ползване', 'Политика за Поверителност', 'Политика за Възстановяване'];
const SUPPORT_LINKS = ['Помощен Център', 'Чат на Живо', 'Проследи Поръчка'];

export default function Footer() {
  return (
    <footer
      className="border-t py-12 px-4"
      style={{ backgroundColor: '#011627', borderColor: 'rgba(255, 51, 102, 0.2)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#ff3366' }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ color: '#f6f7f8' }}>
                VBucks Shop
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Вашият доверен източник за виртуална валута
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: '#f6f7f8' }}>
              Бърз Достъп
            </h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="text-gray-400 text-sm transition-colors hover:text-[#ff3366]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: '#f6f7f8' }}>
              Правна Информация
            </h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="text-gray-400 text-sm transition-colors hover:text-[#ff3366]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: '#f6f7f8' }}>
              Поддръжка
            </h4>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="text-gray-400 text-sm transition-colors hover:text-[#ff3366]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center" style={{ borderColor: '#36213e' }}>
          <p className="text-gray-500 text-sm">&copy; 2026 VBucks Shop. Всички права запазени.</p>
        </div>
      </div>
    </footer>
  );
}
