'use client';

import { useEffect, useState } from 'react';

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_REDIRECT_URL || 'https://t.me/';
const COUNTDOWN_SECONDS = 10;

export default function ThanksPage() {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = TELEGRAM_URL;
      return;
    }
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // SVG circle progress hisoblash
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = ((COUNTDOWN_SECONDS - seconds) / COUNTDOWN_SECONDS) * circumference;

  return (
    <main className="page-wrap">
      <div className="card">
        <div className="thanks-wrap">
          {/* Animated check icon */}
          <div className="check-circle">
            <svg className="check-svg" viewBox="0 0 52 52">
              <path d="M14 27 l8 8 l16-18" />
            </svg>
          </div>

          <h1 className="thanks-title">Rahmat!</h1>
          <p className="thanks-sub">
            Arizangiz qabul qilindi.<br />
            Tez orada siz bilan bog'lanamiz.
          </p>

          {/* Countdown */}
          <div className="countdown-wrap">
            <span className="countdown-label">Telegramga yo'naltirilmoqda</span>
            <div className="countdown-circle">
              <svg className="countdown-svg" width="100" height="100">
                <circle
                  className="countdown-bg"
                  cx="50"
                  cy="50"
                  r={radius}
                />
                <circle
                  className="countdown-fg"
                  cx="50"
                  cy="50"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                />
              </svg>
              <div className="countdown-number">{seconds}</div>
            </div>
          </div>

          <a href={TELEGRAM_URL} className="tg-btn">
            <svg className="tg-icon" viewBox="0 0 24 24">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
            </svg>
            Hozir o'tish
          </a>
        </div>
      </div>
    </main>
  );
}
