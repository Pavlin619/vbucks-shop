import { Zap } from 'lucide-react';

interface FooterLink {
  label: string;
  href: string;
}

const QUICK_LINKS: FooterLink[] = [
  { label: 'Контакт', href: '/contact' },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Условия за Ползване', href: '/terms-of-use' },
  { label: 'Политика за Поверителност', href: '/privacy-policy' },
  { label: 'Политика за Възстановяване', href: '/refund-policy' },
];

interface LinkColumnProps {
  title: string;
  links: FooterLink[];
}

function LinkColumn({ title, links }: LinkColumnProps) {
  return (
    <div>
      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-brand-text">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              className="text-brand-muted text-sm transition-colors hover:text-brand-accent"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-dark py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-accent">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-brand-text">VBucks Shop</span>
            </div>
            <p className="text-brand-muted text-sm">
              Вашият доверен източник за виртуална валута
            </p>
          </div>

          <LinkColumn title="Бърз Достъп" links={QUICK_LINKS} />
          <LinkColumn title="Правна Информация" links={LEGAL_LINKS} />
        </div>

        <div className="border-t border-brand-purple pt-8 text-center">
          <p className="text-brand-muted text-sm">
            &copy; 2026 Promociika.com. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
}
