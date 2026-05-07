import { logger } from './logger';

interface EmbedOptions {
  allowedDomains: string[];
  perImageTimeoutMs: number;
  totalTimeoutMs: number;
}

const DEFAULT_OPTIONS: EmbedOptions = {
  allowedDomains: [],
  perImageTimeoutMs: 5_000,
  totalTimeoutMs: 30_000,
};

const IMG_SRC_RE = /<img\s[^>]*src="(https?:\/\/[^"]+)"[^>]*>/gi;

function isDomainAllowed(url: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return true;
  try {
    const hostname = new URL(url).hostname;
    return allowedDomains.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

async function fetchAsDataUri(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onParentAbort = () => controller.abort();
  signal?.addEventListener('abort', onParentAbort, { once: true });

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? 'image/png';
    const parts = contentType.split(';');
    const mime = (parts[0] ?? 'image/png').trim();
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onParentAbort);
  }
}

/**
 * Replace external image URLs in HTML with inline base64 data URIs.
 * Only fetches images from allowed domains (SSRF prevention).
 * Failed images keep their original URL.
 */
export async function embedImagesInHtml(
  html: string,
  options?: Partial<EmbedOptions>,
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const matches: Array<{ fullMatch: string; url: string }> = [];
  const re = new RegExp(IMG_SRC_RE.source, IMG_SRC_RE.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const url = match[1];
    if (url && isDomainAllowed(url, opts.allowedDomains)) {
      matches.push({ fullMatch: match[0], url });
    }
  }

  if (matches.length === 0) return html;

  const budgetController = new AbortController();
  const budgetTimeout = setTimeout(
    () => budgetController.abort(),
    opts.totalTimeoutMs,
  );

  try {
    const results = await Promise.allSettled(
      matches.map(({ url }) =>
        fetchAsDataUri(url, opts.perImageTimeoutMs, budgetController.signal),
      ),
    );

    let result = html;
    for (let i = 0; i < matches.length; i++) {
      const entry = matches[i]!;
      const r = results[i]!;
      if (r.status === 'fulfilled' && r.value) {
        result = result.replace(
          entry.fullMatch,
          entry.fullMatch.replace(entry.url, r.value),
        );
      } else {
        logger.warn('Failed to embed image, keeping original URL', {
          url: entry.url,
        });
      }
    }

    return result;
  } finally {
    clearTimeout(budgetTimeout);
  }
}
