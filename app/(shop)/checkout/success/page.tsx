import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: '#011627' }}
    >
      <div
        className="rounded-2xl p-10 max-w-md w-full"
        style={{ backgroundColor: '#36213e', border: '2px solid #ff3366' }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,51,102,0.15)' }}
        >
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#f6f7f8' }}>
          Плащането е успешно!
        </h1>
        <p className="mt-3 text-gray-400">
          Вашите V-Bucks са кредитирани. Може да отнеме няколко секунди да се появят.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full px-6 py-3 font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#ff3366', color: '#f6f7f8' }}
        >
          Към началото
        </Link>
      </div>
    </main>
  );
}
