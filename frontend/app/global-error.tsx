'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          Une erreur inattendue s&apos;est produite
        </h1>
        <p style={{ color: '#71717A', marginBottom: 24 }}>
          L&apos;erreur a ete signalée automatiquement. Vous pouvez réessayer ci-dessous.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 9,
            border: '1px solid #E5E7EB',
            background: '#FAFAF9',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
