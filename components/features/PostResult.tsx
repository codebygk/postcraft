'use client';
import { useState, useRef } from 'react';
import type { GeneratedResults, GeneratedPost, Platform, PostStatus } from '@/types';
import type { useLinkedIn } from '@/hooks/useLinkedIn';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import {
  CopyIcon, CheckIcon, LinkedInIcon, XIcon, InstagramIcon,
  ExpandIcon, ShrinkIcon,
} from '@/components/icons';
import { PLATFORMS } from '@/lib/constants';

const PLATFORM_ICONS: Record<Platform, React.FC<{ className?: string }>> = {
  linkedin:  LinkedInIcon,
  x:         XIcon,
  instagram: InstagramIcon,
};

function FormattedText({ content }: { content: string }) {
  return (
    <div className="post-text">
      {content.split(/\n\n+/).map((para, i) => {
        const lines = para.split('\n');
        return (
          <p key={i} className="post-para">
            {lines.map((line, j) => (
              <span key={j}>
                {line.split(/(#\w+)/g).map((part, k) =>
                  part.startsWith('#')
                    ? <span key={k} className="post-hashtag">{part}</span>
                    : part
                )}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

interface ModalProps {
  post: GeneratedPost;
  onClose: () => void;
  linkedin: ReturnType<typeof useLinkedIn>;
}

function ExpandedModal({ post, onClose, linkedin }: ModalProps) {
  const { copy, copied }       = useCopyToClipboard();
  const [image, setImage]      = useState<{ base64: string; mime: string; url: string } | null>(null);
  const [status, setStatus]    = useState<PostStatus>('idle');
  const [postError, setPostError] = useState('');
  const [postDone, setPostDone]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = PLATFORMS.find(p => p.id === post.platform)!;
  const Icon = PLATFORM_ICONS[post.platform];
  const pct  = Math.min((post.characterCount / meta.charLimit) * 100, 100);
  const over = post.characterCount > meta.charLimit;

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      setImage({ base64, mime, url: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handlePostToLinkedIn() {
    if (!linkedin.token) return;
    setStatus('posting');
    setPostError('');

    try {
      const res = await fetch('/api/linkedin/post', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken:   linkedin.token.accessToken,
          authorUrn:     linkedin.token.sub,
          content:       post.content,
          imageBase64:   image?.base64,
          imageMimeType: image?.mime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Post failed');
      setStatus('done');
      setPostDone(true);
    } catch (e: unknown) {
      setStatus('error');
      setPostError(e instanceof Error ? e.message : 'Failed to post');
    }
  }

  const isLinkedIn    = post.platform === 'linkedin';
  const canPost       = isLinkedIn && linkedin.isConnected && status === 'idle';
  const statusLabel: Record<PostStatus, string> = {
    idle:      'Post to LinkedIn',
    uploading: 'Uploading image…',
    posting:   'Posting…',
    done:      'Posted!',
    error:     'Retry',
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className={`modal-card modal-card-${post.platform} fadeUp`} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="modal-header">
          <div className={`post-card-platform ${meta.colorClass}`}>
            <Icon className="post-card-icon" />
            <span className="post-card-name">{meta.label}</span>
          </div>
          <div className="modal-actions">
            <button className="copy-btn" onClick={() => copy(post.content)}>
              {copied
                ? <><CheckIcon className="copy-btn-icon check-green" /><span>Copied!</span></>
                : <><CopyIcon  className="copy-btn-icon" /><span>Copy</span></>
              }
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <ShrinkIcon className="icon-btn-svg" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <FormattedText content={post.content} />

          {/* Image attachment — LinkedIn only */}
          {isLinkedIn && (
            <div className="modal-image-section">
              {image ? (
                <div className="image-preview-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="Post image" className="image-preview" />
                  <button className="image-remove-btn" onClick={removeImage}>Remove</button>
                </div>
              ) : (
                <button className="image-upload-btn" onClick={() => fileRef.current?.click()}>
                  <span className="image-upload-icon">+</span>
                  <span>Add image</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="char-track">
            <div className="char-bar">
              <div className={`char-fill char-fill-${post.platform} ${over ? 'char-fill-over' : ''}`}
                style={{ width: `${pct}%` }} />
            </div>
            <span className={`char-label ${over ? 'char-label-over' : ''}`}>
              {post.characterCount.toLocaleString()} / {meta.charLimit.toLocaleString()}
            </span>
          </div>
          {post.hashtagCount > 0 && <span className="tag-badge">{post.hashtagCount} tags</span>}

          {/* Post to LinkedIn */}
          {isLinkedIn && (
            linkedin.isConnected ? (
              <button
                className={`li-post-btn ${postDone ? 'li-post-btn-done' : ''} ${status === 'error' ? 'li-post-btn-error' : ''}`}
                onClick={handlePostToLinkedIn}
                disabled={status === 'posting' || status === 'uploading' || postDone}
              >
                <LinkedInIcon className="li-post-btn-icon" />
                {statusLabel[status]}
              </button>
            ) : (
              <a href="/api/linkedin/auth" className="li-post-btn li-post-btn-connect">
                <LinkedInIcon className="li-post-btn-icon" />
                Connect to post
              </a>
            )
          )}
        </div>

        {postError && <p className="modal-error">{postError}</p>}
      </div>
    </div>
  );
}

function PostCard({ post, linkedin }: { post: GeneratedPost; linkedin: ReturnType<typeof useLinkedIn> }) {
  const { copy, copied } = useCopyToClipboard();
  const [expanded, setExpanded] = useState(false);
  const meta = PLATFORMS.find(p => p.id === post.platform)!;
  const pct  = Math.min((post.characterCount / meta.charLimit) * 100, 100);
  const over = post.characterCount > meta.charLimit;
  const Icon = PLATFORM_ICONS[post.platform];

  return (
    <>
      <div className={`post-card post-card-${post.platform} fadeUp`}>
        <div className="post-card-header">
          <div className={`post-card-platform ${meta.colorClass}`}>
            <Icon className="post-card-icon" />
            <span className="post-card-name">{meta.label}</span>
          </div>
          <div className="card-actions">
            <button className="copy-btn" onClick={() => copy(post.content)}>
              {copied
                ? <><CheckIcon className="copy-btn-icon check-green" /><span>Copied!</span></>
                : <><CopyIcon  className="copy-btn-icon" /><span>Copy</span></>
              }
            </button>
            <button className="icon-btn" onClick={() => setExpanded(true)} title="Expand">
              <ExpandIcon className="icon-btn-svg" />
            </button>
          </div>
        </div>

        <div className="post-card-body post-card-body-fixed">
          <FormattedText content={post.content} />
        </div>

        <div className="post-card-footer">
          <div className="char-track">
            <div className="char-bar">
              <div className={`char-fill char-fill-${post.platform} ${over ? 'char-fill-over' : ''}`}
                style={{ width: `${pct}%` }} />
            </div>
            <span className={`char-label ${over ? 'char-label-over' : ''}`}>
              {post.characterCount.toLocaleString()} / {meta.charLimit.toLocaleString()}
            </span>
          </div>
          {post.hashtagCount > 0 && <span className="tag-badge">{post.hashtagCount} tags</span>}
          <button className="expand-hint" onClick={() => setExpanded(true)}>
            <ExpandIcon className="expand-hint-icon" />
          </button>
        </div>
      </div>

      {expanded && (
        <ExpandedModal post={post} onClose={() => setExpanded(false)} linkedin={linkedin} />
      )}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="post-card skeleton-card">
      <div className="post-card-header"><div className="sk sk-header" /></div>
      <div className="post-card-body post-card-body-fixed">
        <div className="sk sk-line" />
        <div className="sk sk-line sk-short" />
        <div className="sk sk-line" />
        <div className="sk sk-line sk-mid" />
        <div className="sk sk-line sk-short" />
      </div>
      <div className="post-card-footer"><div className="sk sk-line sk-short" /></div>
    </div>
  );
}

interface Props {
  results: GeneratedResults;
  loading: boolean;
  enabledPlatforms: Platform[];
  linkedin: ReturnType<typeof useLinkedIn>;
}

export function PostResult({ results, loading, enabledPlatforms, linkedin }: Props) {
  const platforms = PLATFORMS.filter(p => enabledPlatforms.includes(p.id));
  return (
    <div className="results-panel">
      {platforms.map(p => (
        <div key={p.id} className="result-col">
          {loading && !results[p.id] ? <SkeletonCard /> : null}
          {results[p.id] ? <PostCard post={results[p.id]!} linkedin={linkedin} /> : null}
        </div>
      ))}
    </div>
  );
}