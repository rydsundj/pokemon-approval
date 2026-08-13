// ============================================================
//  scrape-image
//  Tar emot en Tradera-URL, hämtar HTML på serversidan (undviker
//  CORS) och plockar ut ALLA foton i annonsen (fram, bak, detaljer).
//  Traderas bilder ligger på img.tradera.net som
//    .../{storlek}/{grupp}/{annons-id}_{uuid}.jpg
//  Samma foto finns i flera storlekar → vi avduplicerar på filnamnet
//  och normaliserar till "large-fit" (bra visningsstorlek).
//  Returnerar { imageUrls: string[], imageUrl: string | null }.
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
      return json({ imageUrls: [], imageUrl: null, error: `Sidan svarade ${res.status}.` }, 200);
    }

    const html = await res.text();
    const imageUrls = extractImages(html, url);
    return json({ imageUrls, imageUrl: imageUrls[0] ?? null });
  } catch (err) {
    return json({ imageUrls: [], imageUrl: null, error: `Kunde inte hämta sidan: ${String(err)}` }, 200);
  }
});

const MAX_IMAGES = 12;

function extractImages(html: string, pageUrl: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  // 1. Traderas egna foton (i annonsens ordning: fram, bak, detaljer …).
  const re =
    /img\.tradera\.net\/[a-z0-9-]+\/(\d+)\/([A-Za-z0-9._-]+\.(?:jpe?g|png|webp))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const group = m[1];
    const file = m[2];
    if (seen.has(file)) continue; // dedupe på filnamn (id_uuid)
    seen.add(file);
    out.push(`https://img.tradera.net/large-fit/${group}/${file}`);
    if (out.length >= MAX_IMAGES) break;
  }
  if (out.length > 0) return out;

  // 2. Fallback för andra sidor: og:image → twitter:image → första <img>.
  const single =
    metaContent(html, 'property', 'og:image') ??
    metaContent(html, 'name', 'og:image') ??
    metaContent(html, 'property', 'og:image:secure_url') ??
    metaContent(html, 'name', 'twitter:image') ??
    firstImg(html);
  return single ? [absolutize(single, pageUrl)] : [];
}

// Läser <meta ATTR="KEY" content="...">, oavsett attributordning.
function metaContent(html: string, attr: string, key: string): string | null {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${esc}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${esc}["']`, 'i'),
  ];
  for (const rx of patterns) {
    const match = html.match(rx);
    if (match) return decodeEntities(match[1]);
  }
  return null;
}

function firstImg(html: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    if (/\.svg(\?|$)/i.test(src)) continue;
    if (/sprite|icon|logo|placeholder|blank|pixel|1x1/i.test(src)) continue;
    if (/^data:/i.test(src)) continue;
    return src;
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
