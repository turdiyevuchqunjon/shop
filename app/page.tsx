'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Oddiy validatsiya
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Iltimos, to\'g\'ri ism kiriting');
      return;
    }
    if (!form.address.trim() || form.address.trim().length < 2) {
      setError('Iltimos, manzilingizni kiriting');
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 9) {
      setError('Iltimos, to\'g\'ri telefon raqam kiriting');
      return;
    }

    setLoading(true);

    try {
      // Frontend Pixel event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Lead Form Submission',
        });
      }

      // Backend API ga yuborish (Telegram + Meta CAPI)
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Yuborishda xatolik');
      }

      // Thanks sahifasiga o'tish
      router.push('/thanks');
    } catch (err) {
      setError('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="card">
        {/* HEADER */}
        <div className="header">
          <div className="pre-title">
            <span className="pulse-dot"></span>
            <span>Ayollar oyoq kiyimi | Asmo Shop</span>
          </div>
          <h1 className="title">Eng yaxshi tanlov</h1>
          <p className="post-title">
            Eng sara oyoq kiyimlar
            Cheklangan miqdorda mavjud.
          </p>
        </div>

        {/* FORM */}
        <div className="form-section">
          <h2 className="form-title">Ariza yuborish</h2>
          <p className="form-sub">🇹🇷 Turkiya
🚚 Yandex va BTS</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <span className="field-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                className="input"
                type="text"
                name="name"
                placeholder="Ismingiz"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="field">
              <span className="field-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              <input
                className="input"
                type="text"
                name="address"
                placeholder="Manzilingiz (shahar)"
                value={form.address}
                onChange={handleChange}
                disabled={loading}
                autoComplete="address-level2"
              />
            </div>

            <div className="field">
              <span className="field-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
              <input
                className="input"
                type="tel"
                name="phone"
                placeholder="+998 90 123 45 67"
                value={form.phone}
                onChange={handleChange}
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  Arizani yuborish <span className="btn-arrow">→</span>
                </>
              )}
            </button>

            <div className="error-msg">{error}</div>
          </form>

          <div className="footer-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Ma'lumotlaringiz himoyalangan
          </div>
        </div>
      </div>
    </main>
  );
}
