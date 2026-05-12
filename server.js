import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 3000);
const staticPages = [
  '/',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/articles/what-is-cnam.html',
  '/articles/cnam-vs-caller-id.html',
  '/articles/why-caller-names-show-wrong.html',
  '/articles/how-carrier-lookup-works.html',
  '/articles/is-cnam-lookup-free.html',
  '/articles/how-to-identify-voip-numbers.html'
];

function getSiteUrl(req) {
  const configuredSiteUrl = process.env.SITE_URL?.replace(/\/$/, '');
  if (configuredSiteUrl && !configuredSiteUrl.includes('localhost') && !configuredSiteUrl.includes('127.0.0.1')) {
    return configuredSiteUrl;
  }

  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}`.replace(/\/$/, '');
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://pagead2.googlesyndication.com'],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ['https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com']
      }
    }
  })
);
app.use(express.json({ limit: '12kb' }));
app.use(express.static('public'));

app.get('/robots.txt', (req, res) => {
  const siteUrl = getSiteUrl(req);
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const siteUrl = getSiteUrl(req);
  const urls = staticPages
    .map((page) => `  <url><loc>${siteUrl}${page}</loc></url>`)
    .join('\n');

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

function normalizePhoneNumber(input) {
  const raw = String(input || '').trim();
  const compact = raw.replace(/[^\d+]/g, '');

  if (/^\+\d{8,15}$/.test(compact)) {
    return compact;
  }

  const digits = compact.replace(/\D/g, '');
  if (/^\d{10}$/.test(digits)) {
    return `+1${digits}`;
  }

  if (/^1\d{10}$/.test(digits)) {
    return `+${digits}`;
  }

  throw new Error('Enter a valid phone number, like +12125551212 or 212-555-1212.');
}

function pickResult(data) {
  const carrier = data.carrier || {};
  const portability = data.portability || {};

  return {
    phoneNumber: data.phone_number || null,
    nationalFormat: data.national_format || null,
    countryCode: data.country_code || null,
    callerName: data.caller_name?.caller_name || null,
    callerNameError: data.caller_name?.error_code || null,
    carrierName:
      carrier.name ||
      portability.spid_carrier_name ||
      portability.altspid_carrier_name ||
      carrier.type ||
      portability.line_type ||
      null,
    normalizedCarrier:
      carrier.normalized_carrier ||
      carrier.name ||
      portability.spid_carrier_name ||
      carrier.type ||
      portability.line_type ||
      null,
    lineType: carrier.type || portability.line_type || null,
    city: portability.city || null,
    state: portability.state || null,
    raw: data
  };
}

app.get('/api/config', (_req, res) => {
  res.json({
    adsEnabled: process.env.ADS_ENABLED === 'true',
    adsenseClientId: process.env.ADSENSE_CLIENT_ID || '',
    adSlots: {
      rectangle: process.env.ADSENSE_SLOT_RECT || '',
      link: process.env.ADSENSE_SLOT_LINK || ''
    }
  });
});

app.post('/api/lookup', lookupLimiter, async (req, res) => {
  if (!process.env.TELNYX_API_KEY) {
    res.status(503).json({ error: 'Lookup service is temporarily unavailable. Please try again later.' });
    return;
  }

  let phoneNumber;
  try {
    phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);
  } catch (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  const url = new URL(`https://api.telnyx.com/v2/number_lookup/${encodeURIComponent(phoneNumber)}`);
  url.searchParams.append('type', 'carrier');
  url.searchParams.append('type', 'caller-name');

  try {
    const telnyxResponse = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
      }
    });

    const payload = await telnyxResponse.json().catch(() => ({}));

    if (!telnyxResponse.ok) {
      res.status(telnyxResponse.status).json({
        error: 'Lookup could not be completed. Please check the number and try again.'
      });
      return;
    }

    res.json({ result: pickResult(payload.data || {}) });
  } catch {
    res.status(502).json({ error: 'Lookup service is temporarily unavailable. Please try again later.' });
  }
});

app.listen(port, () => {
  console.log(`CNAM lookup app listening on http://localhost:${port}`);
});
