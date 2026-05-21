import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Telegram konfiguratsiyasi
const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Meta CAPI konfiguratsiyasi
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

// UTM ma'lumotlari uchun umumiy tip
type UtmData = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

// SHA-256 hash (Meta CAPI uchun majburiy)
function sha256(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// Telegram Markdown'da maxsus belgilarni escape qilish
function escapeMarkdown(text: string | null | undefined): string {
  if (!text) return '—';
  return String(text).replace(/([_*`\[\]])/g, '\\$1');
}

// Telegramga xabar yuborish
async function sendToTelegram(
  data: {
    name: string;
    address: string;
    phone: string;
    ip: string;
    userAgent: string;
  } & UtmData
) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    console.warn('[Telegram] Token yoki Chat ID sozlanmagan');
    return { ok: false, reason: 'not_configured' };
  }

  const now = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
  });

  // UTM bormi yo'qmi tekshirish — manba blokini moslashtirish uchun
  const hasUtm = Boolean(
    data.utm_source ||
      data.utm_medium ||
      data.utm_campaign ||
      data.utm_content ||
      data.utm_term
  );

  const sourceBlock = hasUtm
    ? `📊 *MANBA: REKLAMADAN*\n` +
      `🎯 *Source:* ${escapeMarkdown(data.utm_source)}\n` +
      `📢 *Medium:* ${escapeMarkdown(data.utm_medium)}\n` +
      `🚀 *Campaign:* ${escapeMarkdown(data.utm_campaign)}\n` +
      `🔑 *Content:* ${escapeMarkdown(data.utm_content)}\n` +
      `🔍 *Term:* ${escapeMarkdown(data.utm_term)}\n\n`
    : `📊 *MANBA:* to'g'ridan-to'g'ri\n\n`;

  const text =
    `🔔 *YANGI LID!*\n\n` +
    `👤 *Ism:* ${escapeMarkdown(data.name)}\n` +
    `📍 *Manzil:* ${escapeMarkdown(data.address)}\n` +
    `📱 *Telefon:* \`${data.phone}\`\n\n` +
    sourceBlock +
    `🕒 *Vaqt:* ${now}\n` +
    `🌐 *IP:* ${data.ip}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );
    const json = await res.json();
    if (!json.ok) {
      console.error('[Telegram] Error:', json);
      return { ok: false, reason: 'api_error', details: json };
    }
    return { ok: true };
  } catch (err) {
    console.error('[Telegram] Exception:', err);
    return { ok: false, reason: 'exception' };
  }
}

// Meta Conversions API ga yuborish
async function sendToMetaCAPI(
  data: {
    name: string;
    phone: string;
    ip: string;
    userAgent: string;
    fbp?: string;
    fbc?: string;
  } & UtmData
) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.warn('[Meta CAPI] Pixel ID yoki Access Token sozlanmagan');
    return { ok: false, reason: 'not_configured' };
  }

  // Telefonni normallashtirish (faqat raqamlar)
  const normalizedPhone = data.phone.replace(/\D/g, '');

  // Ismni qismlarga ajratish
  const nameParts = data.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // UTM'lardan custom_data tuzish — Meta'da kampaniya bo'yicha tahlil uchun
  const customData: Record<string, string> = {};
  if (data.utm_source) customData.utm_source = data.utm_source;
  if (data.utm_medium) customData.utm_medium = data.utm_medium;
  if (data.utm_campaign) customData.utm_campaign = data.utm_campaign;
  if (data.utm_content) customData.utm_content = data.utm_content;
  if (data.utm_term) customData.utm_term = data.utm_term;

  const eventData = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: process.env.NEXT_PUBLIC_SITE_URL || '',
        user_data: {
          ph: [sha256(normalizedPhone)],
          fn: [sha256(firstName)],
          ln: lastName ? [sha256(lastName)] : undefined,
          client_ip_address: data.ip,
          client_user_agent: data.userAgent,
          fbp: data.fbp || undefined,
          fbc: data.fbc || undefined,
        },
        ...(Object.keys(customData).length > 0 && { custom_data: customData }),
      },
    ],
    ...(META_TEST_EVENT_CODE && { test_event_code: META_TEST_EVENT_CODE }),
  };

  try {
    const url = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    const json = await res.json();
    if (json.error) {
      console.error('[Meta CAPI] Error:', json.error);
      return { ok: false, reason: 'api_error', details: json.error };
    }
    return { ok: true, response: json };
  } catch (err) {
    console.error('[Meta CAPI] Exception:', err);
    return { ok: false, reason: 'exception' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, phone } = body;

    // Server-side validatsiya
    if (!name || !address || !phone) {
      return NextResponse.json(
        { error: "Barcha maydonlar to'ldirilishi shart" },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: "Noto'g'ri ism" }, { status: 400 });
    }
    if (typeof phone !== 'string' || phone.replace(/\D/g, '').length < 9) {
      return NextResponse.json(
        { error: "Noto'g'ri telefon raqam" },
        { status: 400 }
      );
    }

    // IP va User-Agent
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Facebook cookie larini olish (CAPI sifati uchun)
    const cookies = req.headers.get('cookie') || '';
    const fbpMatch = cookies.match(/_fbp=([^;]+)/);
    const fbcMatch = cookies.match(/_fbc=([^;]+)/);

    // UTM'larni cookie'dan ham olib qo'yish (zaxira sifatida)
    const getCookieValue = (name: string): string | null => {
      const match = cookies.match(new RegExp(`${name}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    };

    // UTM'lar — birinchi navbatda body'dan, bo'lmasa cookie'dan
    const utmData: UtmData = {
      utm_source: body.utm_source || getCookieValue('utm_source') || null,
      utm_medium: body.utm_medium || getCookieValue('utm_medium') || null,
      utm_campaign: body.utm_campaign || getCookieValue('utm_campaign') || null,
      utm_content: body.utm_content || getCookieValue('utm_content') || null,
      utm_term: body.utm_term || getCookieValue('utm_term') || null,
    };

    const leadData = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      ip,
      userAgent,
      fbp: fbpMatch?.[1],
      fbc: fbcMatch?.[1],
      ...utmData,
    };

    // Telegram va Meta CAPI ga parallel yuborish
    const [tgResult, metaResult] = await Promise.allSettled([
      sendToTelegram(leadData),
      sendToMetaCAPI(leadData),
    ]);

    console.log('[Lead] Telegram:', tgResult);
    console.log('[Lead] Meta CAPI:', metaResult);

    // Hatto biror service ishlamasa ham, user ga muvaffaqiyat qaytarish
    return NextResponse.json({
      success: true,
      telegram: tgResult.status === 'fulfilled' ? tgResult.value : null,
      meta: metaResult.status === 'fulfilled' ? metaResult.value : null,
    });
  } catch (err) {
    console.error('[Lead API] Error:', err);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}