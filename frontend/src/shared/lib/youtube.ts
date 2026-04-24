const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const YOUTUBE_EMBED_BASE_URL = 'https://www.youtube.com/embed';
const YOUTUBE_WATCH_BASE_URL = 'https://www.youtube.com/watch';

export function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (!YOUTUBE_HOSTS.has(parsed.hostname)) {
      return null;
    }

    if (parsed.hostname.includes('youtu.be')) {
      const shortId = parsed.pathname.replace('/', '').trim();
      return shortId || null;
    }

    const searchVideoId = parsed.searchParams.get('v');
    if (searchVideoId) {
      return searchVideoId;
    }

    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const embedIndex = pathSegments.findIndex((segment) => segment === 'embed');
    if (embedIndex >= 0 && pathSegments[embedIndex + 1]) {
      return pathSegments[embedIndex + 1];
    }

    const shortsIndex = pathSegments.findIndex((segment) => segment === 'shorts');
    if (shortsIndex >= 0 && pathSegments[shortsIndex + 1]) {
      return pathSegments[shortsIndex + 1];
    }

    return null;
  } catch {
    return null;
  }
}

export function buildYouTubeEmbedUrl(rawUrl: string): string | null {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) {
    return null;
  }
  return `${YOUTUBE_EMBED_BASE_URL}/${videoId}`;
}

export function buildYouTubeWatchUrl(rawUrl: string): string {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) {
    return rawUrl;
  }
  return `${YOUTUBE_WATCH_BASE_URL}?v=${videoId}`;
}
