import React, { useState } from 'react';
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

export default function HelpMedia({ media }) {
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!media || !media.src || hasLoadError) {
    return <HelpMediaPlaceholder media={media} />;
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
            src={media.src}
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
            className="help-media__asset"
            src={media.src}
            poster={media.poster}
            autoPlay
            loop
            muted
            playsInline
            controls
            preload="metadata"
            onError={() => setHasLoadError(true)}
          />
        </div>
        {caption}
      </figure>
    );
  }

  return <HelpMediaPlaceholder media={media} />;
}
