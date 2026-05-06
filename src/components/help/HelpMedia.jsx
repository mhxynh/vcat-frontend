import React from 'react';
import { HELP_MEDIA_TYPES } from '../../data/help/docs';

export default function HelpMedia({ media }) {
  if (!media) return null;

  const caption = media.title ? (
    <figcaption className="help-media__caption">{media.title}</figcaption>
  ) : null;

  if (media.type === HELP_MEDIA_TYPES.GIF) {
    return (
      <figure className="help-media">
        <div className="help-media__frame">
          <img className="help-media__asset" src={media.src} alt={media.title || ''} />
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
            controls
            preload="metadata"
          />
        </div>
        {caption}
      </figure>
    );
  }

  return null;
}
