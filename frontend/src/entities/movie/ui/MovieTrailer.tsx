'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl } from '@/shared/lib/youtube';

interface MovieTrailerProps {
  trailerUrl: string;
}

const TRAILER_TEXTS = {
  title: 'Trailer',
  externalLink: 'Abrir trailer em nova guia',
  fallbackTitle: 'Nao foi possivel carregar o player embutido.',
  fallbackDescription:
    'Seu navegador ou rede pode ter bloqueado o embed. Voce ainda pode assistir no YouTube.',
  retry: 'Tentar novamente',
} as const;

const EMBED_LOAD_TIMEOUT_MS = 6000;

export function MovieTrailer({ trailerUrl }: MovieTrailerProps) {
  const embedUrl = buildYouTubeEmbedUrl(trailerUrl);
  const externalUrl = useMemo(() => buildYouTubeWatchUrl(trailerUrl), [trailerUrl]);
  const [retryKey, setRetryKey] = useState(0);
  const iframeLoadedRef = useRef(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!embedUrl) {
      return;
    }

    iframeLoadedRef.current = false;
    setShowFallback(false);

    const timeoutId = window.setTimeout(() => {
      if (!iframeLoadedRef.current) {
        setShowFallback(true);
      }
    }, EMBED_LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [embedUrl, retryKey]);

  if (!embedUrl) {
    return (
      <div className="mb-8 p-4 bg-muted rounded-xl border border-border">
        <p className="text-muted-foreground text-sm mb-2 font-semibold">
          {TRAILER_TEXTS.title}
        </p>
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:text-primary/80 underline break-all"
        >
          {TRAILER_TEXTS.externalLink}
        </a>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-muted-foreground text-sm mb-2 font-semibold">
        {TRAILER_TEXTS.title}
      </p>
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted aspect-video">
        {!showFallback ? (
          <iframe
            key={`${embedUrl}-${retryKey}`}
            src={embedUrl}
            title={TRAILER_TEXTS.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => {
              iframeLoadedRef.current = true;
              setShowFallback(false);
            }}
            onError={() => {
              setShowFallback(true);
            }}
          />
        ) : (
          <TrailerFallbackCard
            externalUrl={externalUrl}
            onRetry={() => setRetryKey((current) => current + 1)}
          />
        )}
      </div>
    </div>
  );
}

interface TrailerFallbackCardProps {
  externalUrl: string;
  onRetry: () => void;
}

function TrailerFallbackCard({ externalUrl, onRetry }: TrailerFallbackCardProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="font-semibold text-foreground">{TRAILER_TEXTS.fallbackTitle}</p>
      <p className="text-sm text-muted-foreground max-w-lg">
        {TRAILER_TEXTS.fallbackDescription}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button variant="outline" className="h-10 px-4 py-0 w-full sm:w-auto" onClick={onRetry}>
          {TRAILER_TEXTS.retry}
        </Button>
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="h-10 px-4 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center justify-center"
        >
          {TRAILER_TEXTS.externalLink}
        </a>
      </div>
    </div>
  );
}
