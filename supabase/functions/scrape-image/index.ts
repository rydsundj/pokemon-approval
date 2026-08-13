// ============================================================
//  scrape-image
//  Tar emot en Tradera-URL, hämtar HTML på serversidan (undviker
//  CORS) och plockar ut en bild-URL: og:image först, annars
//  twitter:image / link[image_src], annars första rimliga <img>.
//  Returnerar { imageUrl: string | null }.
// ============================================================
import { handlePreflight, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return json({ error: 'Endast POST stöds.' }, 405);
  }

  let url = '';
  try {
    const body = await req.json();
    url = String(body?.url ?? '').trim();
  } catch {
    return json({ error: 'Ogiltig JSON.' }, 400);
  }

  if (!/^https?:\/\//i.test(url)) {
    return json({ error: 'Ange en giltig länk (http/https).' }, 400);
  }

  try {
    const res = await fetch(url, {
      headers: {
        // Se ut som en vanlig webbläsare så Tradera svarar med full HTML.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.6',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return json({ imageUrl: null, error: `Sidan svarade ${res.status}.` }, 200);
    }

    const html = await res.text();
    const imageUrl = extractImage(html, url);
    return json({ imageUrl });
  } catch (err) {
    return json({ imageUrl: null, error: `Kunde inte hämta sidan: ${String(err)}` }, 200);
  }
});

function extractImage(html: string, pageUrl: string): string | null {
  // 1. og:image (attributordning kan variera).
  const og =
    metaContent(html, 'property', 'og:image') ??
    metaContent(html, 'name', 'og:image') ??
    metaContent(html, 'property', 'og:image:secure_url');
  if (og) return absolutize(og, pageUrl);

  // 2. twitter:image
  const tw =
    metaContent(html, 'name', 'twitter:image') ??
    metaContent(html, 'property', 'twitter:image');
  if (tw) return absolutize(tw, pageUrl);

  // 3. <link rel="image_src">
  const linkMatch = html.match(
    /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  );
  if (linkMatch) return absolutize(linkMatch[1], pageUrl);

  // 4. Första rimliga <img> — hoppa över ikoner/sprites/pixlar.
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    if (/\.svg(\?|$)/i.test(src)) continue;
    if (/sprite|icon|logo|placeholder|blank|pixel|1x1/i.test(src)) continue;
    if (/^data:/i.test(src)) continue;
    return absolutize(src, pageUrl);
  }

  return null;
}

// Läser <meta ATTR="KEY" content="...">, oavsett attributordning.
function metaContent(html: string, attr: string, key: string): string | null {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${esc}["'][^>]*content=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${esc}["']`,
      'i',
    ),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return decodeEntities(match[1]);
  }
  return null;
}

function absolutize(src: string, base: string): string {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

function decodeEntities(s: string): string {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&#38;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}
