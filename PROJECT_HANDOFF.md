# Free CNAM Lookup Project Handoff

## Project

Free CNAM/carrier lookup website.

Live site:

- https://freecnamlookingup.com

GitHub repo:

- https://github.com/joeye51194-max/free-cnam-lookup

Railway app:

- Project/service name: `free-cnam-lookup`
- Public Railway URL was used before custom domain.
- Production custom domain is `freecnamlookingup.com`.

## Current Status

- Express/Node app is deployed on Railway.
- Domain is registered/managed through Cloudflare.
- DNS is connected to Railway.
- Google AdSense review has been requested.
- Google Search Console ownership is verified.
- Sitemap submitted and processed successfully.
- Sitemap discovered 11 pages.
- Lookup endpoint has a 3-lookups-per-day rate limit per IP.
- Public error messages are generic and do not mention Telnyx or API key details.
- Homepage has been improved for SEO/AdSense with more content, FAQ, guide links, background styling, and emoji accents.

## Environment Variables

Configured in Railway, not committed to GitHub:

- `TELNYX_API_KEY`
- `SITE_URL=https://freecnamlookingup.com`
- `ADS_ENABLED=false` while waiting for AdSense approval
- `ADSENSE_CLIENT_ID=ca-pub-7212750288013173`
- `ADSENSE_SLOT_RECT`
- `ADSENSE_SLOT_LINK`

Do not commit `.env`; it is ignored by git.

## AdSense

Publisher ID:

- `ca-pub-7212750288013173`

AdSense verification script has been added to public pages.

Keep `ADS_ENABLED=false` until Google approves the site. After approval, create ad units in AdSense, copy the slot IDs into Railway variables, then set `ADS_ENABLED=true`.

## Search Console

Search Console verification meta tag was added to the homepage.

Sitemap URL:

- https://freecnamlookingup.com/sitemap.xml

Robots URL:

- https://freecnamlookingup.com/robots.txt

Search Console initially showed the indexing report as processing, which is normal for a new site.

## Important Files

- `server.js`: Express server, Telnyx lookup proxy, rate limit, sitemap, robots.
- `public/index.html`: Homepage and lookup UI.
- `public/app.js`: Frontend lookup behavior and ad-slot loading.
- `public/styles.css`: Site styling.
- `public/about.html`
- `public/contact.html`
- `public/privacy.html`
- `public/terms.html`
- `public/articles/`: SEO/supporting articles.

## Notes For Future Chat

The user wants projects organized per chat. For a future fax testing tool, use a separate folder and preferably a separate GitHub repo and Railway service. Keep environment variables separate per project.

Suggested folder naming:

- `free-cnam-lookup`
- `fax-testing-tool`

Suggested future fax tool launch process:

1. Define the fax testing use case and telecom provider/API.
2. Build a separate app/repo.
3. Keep API keys server-side only.
4. Add rate limits before public launch.
5. Add About, Contact, Privacy, Terms, and educational content before AdSense review.
6. Connect a separate domain/subdomain.
7. Add Search Console and sitemap.

## Security Reminder

The Telnyx API key was pasted into chat during setup. Rotate it before scaling the site publicly.
