import React from 'react';
import IconButton from './IconButton';
import './CommentsList.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function getInitial(author) {
  return (
    String(author || '?')
      .trim()
      .slice(0, 1)
      .toUpperCase() || '?'
  );
}

export default function CommentsList({
  comments = [],
  currentUserId,
  deletingId = null,
  onDelete,
  renderDeleteIcon,
  className = '',
  itemClassName = '',
  leftClassName = '',
  avatarClassName = '',
  mainClassName = '',
  topClassName = '',
  authorClassName = '',
  metaClassName = '',
  dateClassName = '',
  actionClassName = '',
  textClassName = '',
}) {
  return (
    <div className={cx('comments-list', className)}>
      {comments.map((comment) => {
        const canDelete =
          currentUserId != null && String(currentUserId) === String(comment.authorUserId ?? '');
        const commentId = String(comment.id);
        const isDeleting = deletingId === commentId;

        return (
          <div className={cx('comments-list-item', itemClassName)} key={comment.id}>
            <div className={cx('comments-list-left', leftClassName)}>
              <div className={cx('comments-list-avatar', avatarClassName)} aria-hidden="true">
                {getInitial(comment.author)}
              </div>
            </div>

            <div className={cx('comments-list-main', mainClassName)}>
              <div className={cx('comments-list-top', topClassName)}>
                <div className={cx('comments-list-author', authorClassName)}>
                  {comment.author ?? '-'}
                </div>
                <div className={cx('comments-list-meta', metaClassName)}>
                  <div className={cx('comments-list-date', dateClassName)}>
                    {comment.date ?? ''}
                  </div>
                  {canDelete ? (
                    <IconButton
                      className={cx('comments-list-action', actionClassName)}
                      onClick={() => onDelete?.(comment)}
                      disabled={deletingId != null}
                      label="Delete comment"
                      title="Delete comment"
                    >
                      {isDeleting ? '...' : renderDeleteIcon?.(comment)}
                    </IconButton>
                  ) : null}
                </div>
              </div>
              <div className={cx('comments-list-text', textClassName)}>{comment.text ?? ''}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
