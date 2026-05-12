const form = document.querySelector('#lookup-form');
const message = document.querySelector('#message');
const resultPanel = document.querySelector('#result');
const copyResultButton = document.querySelector('#copy-result');
let lastResultText = '';

const fields = {
  number: document.querySelector('#result-number'),
  lineType: document.querySelector('#line-type'),
  callerName: document.querySelector('#caller-name'),
  carrier: document.querySelector('#carrier'),
  normalizedCarrier: document.querySelector('#normalized-carrier'),
  location: document.querySelector('#location')
};

const fallback = 'Not available';

async function loadAds() {
  const response = await fetch('/api/config');
  const config = await response.json();

  if (!config.adsEnabled || !config.adsenseClientId) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsenseClientId)}`;
  script.crossOrigin = 'anonymous';
  document.head.append(script);

  document.querySelectorAll('[data-ad-slot]').forEach((slot) => {
    const slotName = slot.dataset.adSlot;
    const adSlotId = config.adSlots?.[slotName];
    if (!adSlotId) return;

    slot.replaceChildren();
    const ad = document.createElement('ins');
    ad.className = 'adsbygoogle';
    ad.style.display = 'block';
    ad.dataset.adClient = config.adsenseClientId;
    ad.dataset.adSlot = adSlotId;
    ad.dataset.adFormat = 'auto';
    ad.dataset.fullWidthResponsive = 'true';
    slot.append(ad);
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  });
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.dataset.type = type;
}

function displayResult(result) {
  fields.number.textContent = result.nationalFormat || result.phoneNumber || fallback;
  fields.lineType.textContent = result.lineType || 'unknown';
  fields.callerName.textContent = result.callerName || fallback;
  fields.carrier.textContent = result.carrierName || fallback;
  fields.normalizedCarrier.textContent = result.normalizedCarrier || fallback;
  fields.location.textContent = [result.city, result.state, result.countryCode].filter(Boolean).join(', ') || fallback;
  lastResultText = [
    `Phone number: ${fields.number.textContent}`,
    `Line type: ${fields.lineType.textContent}`,
    `Caller name: ${fields.callerName.textContent}`,
    `Carrier: ${fields.carrier.textContent}`,
    `Normalized carrier: ${fields.normalizedCarrier.textContent}`,
    `Location: ${fields.location.textContent}`
  ].join('\n');
  resultPanel.hidden = false;
}

copyResultButton?.addEventListener('click', async () => {
  if (!lastResultText) return;

  try {
    await navigator.clipboard.writeText(lastResultText);
    setMessage('Result copied.', 'success');
  } catch {
    setMessage('Could not copy result. You can select the text manually.', 'error');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button');
  const phoneNumber = new FormData(form).get('phoneNumber');

  submit.disabled = true;
  resultPanel.hidden = true;
  setMessage('Looking up number...');

  try {
    const response = await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Lookup failed.');
    }

    displayResult(payload.result);
    setMessage('Lookup complete.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    submit.disabled = false;
  }
});

loadAds().catch(() => {});
