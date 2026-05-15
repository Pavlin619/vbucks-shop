import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Политика за Възстановяване | VBucks Shop',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-brand-text mb-3">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-brand-muted text-sm leading-relaxed mb-3">{children}</p>;
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-2 text-brand-muted text-sm leading-relaxed mb-3">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-brand-dark min-h-screen py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-brand-text mb-2">
            Политика за Възстановяване
          </h1>
          <p className="text-brand-muted text-sm mb-10">Последна актуализация: 2026</p>

          <P>
            Настоящата политика описва условията, при които можете да поискате възстановяване на
            средства или анулиране на поръчка, направена в VBucks Shop. Предлагаме два вида
            продукти — покупка на V-Bucks с реални пари (чрез Stripe) и поръчки за Fortnite скинове
            (платени с V-Bucks). Правилата за всеки продукт са описани поотделно по-долу.
          </P>

          <Section title="1. Покупки на V-Bucks (плащане с карта)">
            <P>
              <strong className="text-brand-text">Право на отказ (14 дни).</strong> Съгласно
              Закона за защита на потребителите, имате право да се откажете от договора в срок от{' '}
              <strong className="text-brand-text">14 календарни дни</strong> от датата на
              покупката, без да посочвате причина, при условие че закупените V-Bucks{' '}
              <strong className="text-brand-text">не са изразходвани</strong> за поръчка на скин.
            </P>
            <P>
              <strong className="text-brand-text">Изключение за цифрово съдържание.</strong> Ако
              при завършване на поръчката изрично сте потвърдили, че се съгласявате изпълнението на
              договора за цифрово съдържание да започне незабавно и сте приели, че губите правото
              на отказ — възстановяване не е възможно, освен в случаите, описани в т. 3 по-долу.
            </P>
            <P>
              <strong className="text-brand-text">Частично изразходвани V-Bucks.</strong> Ако
              вече сте похарчили част от закупените V-Bucks за поръчка на скин, може да поискате
              възстановяване само за неизразходваната сума.
            </P>
            <P>
              <strong className="text-brand-text">Срок за обработка.</strong> При одобрено
              възстановяване, сумата се връща по оригиналния начин на плащане в срок до{' '}
              <strong className="text-brand-text">5–10 работни дни</strong> от потвърждението на
              искането. Банката или издателят на картата може да наложи допълнително забавяне.
            </P>
          </Section>

          <Section title="2. Поръчки за Fortnite скинове (платени с V-Bucks)">
            <P>
              Поръчките за скинове се изпълняват ръчно от нашия екип чрез подаряване в играта.
              Политиката за анулиране зависи от статуса на поръчката:
            </P>
            <Ul
              items={[
                <>
                  <strong className="text-brand-text">Статус „Чакаща" (pending).</strong> Ако
                  скинът все още не е подарен в играта, можете да поискате анулиране. При одобрено
                  искане изразходваните V-Bucks се връщат по баланса Ви незабавно.
                </>,
                <>
                  <strong className="text-brand-text">Статус „Подарен" (gifted).</strong> След
                  като скинът е изпратен в играта Ви, поръчката не може да бъде анулирана и
                  V-Bucks не се възстановяват. Подареният скин е цифрово съдържание, изпълнено
                  чрез Epic Games.
                </>,
              ]}
            />
            <P>
              Анулирането на поръчка в статус „Чакаща" е възможно само ако поканата за приятелство
              в Fortnite все още не е приета или ако скинът не е налице в текущия Item Shop.
            </P>
          </Section>

          <Section title="3. Случаи, в които извършваме възстановяване независимо от горното">
            <Ul
              items={[
                <>
                  <strong className="text-brand-text">Техническа грешка.</strong> Ако поради
                  техническа неизправност V-Bucks не са кредитирани по Вашия баланс след успешно
                  плащане, ще коригираме незабавно или ще възстановим сумата изцяло.
                </>,
                <>
                  <strong className="text-brand-text">Недостъпност на продукта.</strong> Ако
                  скинът, за който сте поръчали, бъде оттеглен от Epic Games преди изпълнение на
                  поръчката, ще анулираме поръчката и ще върнем V-Bucks по баланса Ви.
                </>,
                <>
                  <strong className="text-brand-text">Дублирано плащане.</strong> Ако по технически
                  причини сте таксувани двукратно за една поръчка, ще възстановим допълнителната
                  сума изцяло.
                </>,
              ]}
            />
          </Section>

          <Section title="4. Как да подадете искане за възстановяване">
            <P>
              За да заявите възстановяване или анулиране, свържете се с нас на:{' '}
              <a
                href="mailto:jasonbourne@promociika.com"
                className="text-brand-accent hover:text-brand-accent-hover underline"
              >
                jasonbourne@promociika.com
              </a>
            </P>
            <P>Моля, включете в съобщението си:</P>
            <Ul
              items={[
                'Имейл адресът, с който сте регистрирани в VBucks Shop',
                'Номер на поръчката или Stripe session ID (видими в потвърдителния имейл)',
                'Причина за искането',
              ]}
            />
            <P>
              Ще отговорим в срок до <strong className="text-brand-text">2 работни дни</strong>{' '}
              от получаване на искането и ще Ви уведомим за решението.
            </P>
          </Section>

          <Section title="5. Жалби и алтернативно решаване на спорове">
            <P>
              Ако не сте доволни от отговора ни, можете да подадете жалба до Комисията за защита
              на потребителите (КЗП): <strong className="text-brand-text">kzp.bg</strong>, тел.{' '}
              <strong className="text-brand-text">0700 111 22</strong>.
            </P>
            <P>
              Можете да използвате и платформата за онлайн решаване на спорове (ОРС) на
              Европейската комисия:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:text-brand-accent-hover underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </P>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
