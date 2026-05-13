import React, { useState } from 'react';
import { getHelpMediaUrl } from '../../api/HelpMediaAPI';
import { HELP_MEDIA_TYPES } from '../../data/help/docs';

function getExpectedMediaName(media) {
  if (!media?.src) return null;

  const parts = String(media.src).split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
}

function mediaTypeLabel(type) {
  if (type === HELP_MEDIA_TYPES.GIF) return 'GIF walkthrough';
  if (type === HELP_MEDIA_TYPES.VIDEO) return 'Video walkthrough';
  return 'Tutorial media';
}

function HelpMediaPlaceholder({ media }) {
  const label = mediaTypeLabel(media?.type);
  const expectedName = getExpectedMediaName(media);

  return (
    <figure className="help-media">
      <div className="help-media__frame help-media__frame--placeholder">
        <div className="help-media__placeholder">
          <div className="help-media__placeholder-label">{label}</div>
          <div className="help-media__placeholder-title">
            {media?.title || 'Tutorial media coming soon'}
          </div>
          <div className="help-media__placeholder-text">
            Drop the final MP4 into public/help-assets using the exact filename shown above.
          </div>
          {expectedName ? (
            <div className="help-media__placeholder-filename">Title the video: {expectedName}</div>
          ) : null}
        </div>
      </div>
    </figure>
  );
}

function HelpMediaLoading({ media }) {
  const label = mediaTypeLabel(media?.type);

  return (
    <figure className="help-media">
      <div className="help-media__frame help-media__frame--placeholder">
        <div className="help-media__placeholder">
          <div className="help-media__placeholder-label">{label}</div>
          <div className="help-media__placeholder-title">Loading media</div>
        </div>
      </div>
    </figure>
  );
}

export default function HelpMedia({ media }) {
  const [resolvedSrc, setResolvedSrc] = useState('');
  const [resolvedPoster, setResolvedPoster] = useState('');
  const [hasLoadError, setHasLoadError] = useState(false);

  React.useEffect(() => {
    let ignore = false;

    setHasLoadError(false);
    setResolvedSrc('');
    setResolvedPoster('');

    if (!media?.src) return undefined;

    async function loadMediaUrls() {
      try {
        const [nextSrc, nextPoster] = await Promise.all([
          getHelpMediaUrl(media.src),
          media.poster ? getHelpMediaUrl(media.poster) : Promise.resolve(''),
        ]);

        if (!ignore) {
          setResolvedSrc(nextSrc);
          setResolvedPoster(nextPoster);
        }
      } catch {
        if (!ignore) {
          setHasLoadError(true);
        }
      }
    }

    loadMediaUrls();

    return () => {
      ignore = true;
    };
  }, [media?.poster, media?.src]);

  if (!media || !media.src || hasLoadError) {
    return <HelpMediaPlaceholder media={media} />;
  }

  if (!resolvedSrc) {
    return <HelpMediaLoading media={media} />;
  }

  const caption = media.title ? (
    <figcaption className="help-media__caption">{media.title}</figcaption>
  ) : null;

  if (media.type === HELP_MEDIA_TYPES.GIF) {
    return (
      <figure className="help-media">
        <div className="help-media__frame">
          <img
            className="help-media__asset"
            src={resolvedSrc}
            alt={media.title || ''}
            onError={() => setHasLoadError(true)}
          />
        </div>
        {caption}
      </figure>
    );
  }

  if (media.type === HELP_MEDIA_TYPES.VIDEO) {
    return (
      <figure className="help-media">
        <div className="help-media__frame">
          <video
            key={resolvedSrc}
            className="help-media__asset"
            src={resolvedSrc}
            poster={resolvedPoster || undefined}
            playsInline
            controls
            preload="none"
            onError={() => setHasLoadError(true)}
          />
        </div>
        {caption}
      </figure>
    );
  }

  return <HelpMediaPlaceholder media={media} />;
}
