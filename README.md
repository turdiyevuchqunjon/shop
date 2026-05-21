# Lead Site — Next.js + Telegram + Meta CAPI

Bir sahifali lid yig'uvchi sayt. Forma ma'lumotlari **Telegram bot**ga va **Meta Conversions API**ga yuboriladi. Yuborishdan keyin foydalanuvchi *thanks* sahifasiga o'tadi va 10 sekunddan keyin Telegram havolasiga avtomatik yo'naltiriladi.

## Texnologiyalar
- **Next.js 14** (App Router)
- **TypeScript**
- **Server-side validatsiya**
- **Meta Pixel + CAPI** (dublikatsiz, deduplication tayyor)
- **Telegram Bot API**

## O'rnatish

```bash
npm install
```

## Sozlash

`.env.example` faylini `.env.local` ga nusxalang:

```bash
cp .env.example .env.local
```

### 1. Telegram Bot

1. Telegramda [@BotFather](https://t.me/BotFather) ni oching
2. `/newbot` ni yuboring, bot nomi va username bering
3. Berilgan **tokenni** `TELEGRAM_BOT_TOKEN` ga qo'ying
4. Botingizni guruh/kanalga **admin** sifatida qo'shing
5. Chat_id ni olish uchun [@userinfobot](https://t.me/userinfobot) yoki [@getidsbot](https://t.me/getidsbot) dan foydalaning
6. Chat_id ni `TELEGRAM_CHAT_ID` ga qo'ying (kanal/guruh uchun `-100...` bilan boshlanadi)
7. `NEXT_PUBLIC_TELEGRAM_REDIRECT_URL` ga foydalanuvchi yo'naltiriladigan havola (kanal/bot/guruh)

### 2. Meta Conversions API

1. [Facebook Business Manager](https://business.facebook.com/) ga kiring
2. **Events Manager** → Pixel tanlang → **Settings**
3. **Conversions API** bo'limidan **Generate access token** bosing
4. `META_PIXEL_ID` va `META_ACCESS_TOKEN` ni `.env.local` ga qo'ying
5. `NEXT_PUBLIC_META_PIXEL_ID` ga ham Pixel ID ni yozing (frontend pixel uchun)
6. Test paytida `META_TEST_EVENT_CODE` ni Events Manager → Test Events dan oling

## Ishga tushirish

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

Sayt `http://localhost:3000` da ochiladi.

## Tuzilma

```
app/
├── api/
│   └── lead/
│       └── route.ts       # POST /api/lead — Telegram + Meta CAPI
├── thanks/
│   └── page.tsx           # Minnatdorchilik sahifasi (10s countdown)
├── globals.css            # Barcha stillar va animatsiyalar
├── layout.tsx             # Root layout + Meta Pixel
└── page.tsx               # Asosiy forma
```

## Lid oqimi

1. Foydalanuvchi formani to'ldiradi (ism, manzil, telefon)
2. Frontend → `Lead` event ni Meta Pixel ga yuboradi (browser-side)
3. Frontend → `POST /api/lead` chaqiradi
4. Backend parallel:
   - Telegramga formatlangan xabar yuboradi
   - Meta CAPI ga hashlangan ma'lumot bilan `Lead` event yuboradi (server-side)
5. Muvaffaqiyatli bo'lsa → `/thanks` sahifasiga o'tadi
6. 10 sekund sanaydi → Telegram URL ga yo'naltiradi

## Meta CAPI haqida muhim

- Telefon raqamlar va ismlar **SHA-256** bilan hashlanadi (Meta talab qiladi)
- `_fbp` va `_fbc` cookie lar event ga qo'shiladi (matching sifatini oshirish uchun)
- Pixel + CAPI birga ishlaydi — Meta dublikatlarni avtomatik aniqlaydi
- Test paytida `META_TEST_EVENT_CODE` orqali Events Manager da real-time tekshirish mumkin

## Production sozlash (Vercel)

1. Repository ni GitHub ga push qiling
2. [Vercel](https://vercel.com) da yangi loyiha yarating
3. **Environment Variables** bo'limiga `.env.local` dagi barcha qiymatlarni qo'shing
4. Deploy bosing

## Diqqat

- `.env.local` faylini **hech qachon** git ga qo'shmang
- Tokenlarni faqat server-side env variables sifatida saqlang (`NEXT_PUBLIC_` prefiksisiz)
- Telegram chat_id `-100` bilan boshlanadi (kanal/guruh), shaxsiy chat uchun musbat son
# shop
