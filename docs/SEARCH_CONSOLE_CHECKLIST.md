# Search Console Checklist

Updated: July 25, 2026

## Goal

Use this checklist after deploying the latest SEO updates for:

- `BpxPro`
- `BPX`
- `BPEXCH`
- `BPXPRO`
- `BettPro`
- `Bett Pro`

## Before You Open Search Console

- Confirm the production homepage loads at `https://www.bpexpro.com/`
- Confirm the new brand landing page loads at `https://www.bpexpro.com/bpx`
- Confirm the new blog post loads at:
  `https://www.bpexpro.com/blog/bpx-bpexch-bettpro-brand-guide`
- Confirm the sitemap loads at `https://www.bpexpro.com/sitemap.xml`
- Confirm `robots.txt` loads at `https://www.bpexpro.com/robots.txt`

## Add Or Verify Property

Recommended:

1. Add a `Domain property` for `bpexpro.com` if you control DNS.
2. If DNS verification is not practical, add a `URL-prefix property` for `https://www.bpexpro.com/`.
3. Keep the verification method active after success.

Practical verification options:

- DNS TXT record
- HTML file upload
- HTML tag

Official help:

- Verify ownership:
  https://support.google.com/webmasters/answer/9008080?hl=en

## Submit Sitemap

1. Open the correct Search Console property.
2. Go to `Sitemaps`.
3. Submit `https://www.bpexpro.com/sitemap.xml`
4. Wait for status `Success`
5. Re-check if Google reports fetch or parse errors

Official help:

- Sitemaps report:
  https://support.google.com/webmasters/answer/7451001?hl=en

## Request Indexing For Priority URLs

Use URL Inspection and request indexing for:

- `https://www.bpexpro.com/`
- `https://www.bpexpro.com/bpx`
- `https://www.bpexpro.com/blog`
- `https://www.bpexpro.com/blog/bpx-bpexch-bettpro-brand-guide`

Good follow-up pages:

- top payment guide
- app install guide
- any page you actively promote externally

Official Search Console tasks overview:

- https://support.google.com/webmasters/answer/10351509?hl=en

## Monitor After Submission

Check these reports during the next 2 to 4 weeks:

- `Page indexing`
- `Sitemaps`
- `Performance`
- `Core Web Vitals`

Watch specifically for:

- homepage impressions for branded queries
- impressions/clicks on `/bpx`
- impressions/clicks on the new brand blog post
- any coverage errors on submitted URLs

## Branded Query Tracking

Search for these in the `Performance` report:

- `bpxpro`
- `bpx`
- `bpexch`
- `bettpro`
- `bett pro`

Track:

- impressions
- average position
- clicks
- landing page receiving the click

## Deployment Sanity Checks

After every deploy:

1. Open page source for homepage and confirm title/description contain brand aliases.
2. Open page source or rendered DOM for `/bpx` and confirm the route sets its own title/canonical.
3. Open the new blog post and confirm title, description and canonical are set.
4. Re-submit the sitemap only if important URLs changed.

## Important Note

These changes improve ranking signals, but they do not guarantee immediate rankings. Branded ranking usually improves faster when all of the following are present:

- consistent naming on-site
- internal links to the branded page
- indexed sitemap entries
- Search Console verification
- external mentions/backlinks using the same brand names
