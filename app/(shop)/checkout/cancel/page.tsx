import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: '#011627' }}
    >
      <div
        className="rounded-2xl p-10 max-w-md w-full"
        style={{ backgroundColor: '#36213e', border: '1px solid rgba(246,247,248,0.15)' }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(246,247,248,0.08)' }}
        >
          <span className="text-3xl">✕</span>
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#f6f7f8' }}>
          Плащането е отменено
        </h1>
        <p className="mt-3 text-gray-400">Не е направено плащане.</p>
        <Link
          href="/cart"
          className="mt-6 inline-block rounded-full px-6 py-3 font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
        >
          Назад към количката
        </Link>
      </div>
    </main>
  );
}
