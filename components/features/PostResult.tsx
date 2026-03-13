'use client';
import { useState } from 'react';
import type { GeneratedResults, GeneratedPost, Platform } from '@/types';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { CopyIcon, CheckIcon, LinkedInIcon, XIcon, InstagramIcon, ExpandIcon, ShrinkIcon } from '@/components/icons';
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

function ExpandedModal({ post, onClose }: { post: GeneratedPost; onClose: () => void }) {
  const { copy, copied } = useCopyToClipboard();
  const meta = PLATFORMS.find(p => p.id === post.platform)!;
  const Icon = PLATFORM_ICONS[post.platform];
  const pct  = Math.min((post.characterCount / meta.charLimit) * 100, 100);
  const over = post.characterCount > meta.charLimit;

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  // (handled via useEffect would need import — use onKeyDown on the dialog div)

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className={`modal-card modal-card-${post.platform} fadeUp`} role="dialog" aria-modal="true">
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

        <div className="modal-body">
          <FormattedText content={post.content} />
        </div>

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
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: GeneratedPost }) {
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

        {/* Fixed-height body — text truncates, expand to see full */}
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
        </div>
      </div>

      {expanded && <ExpandedModal post={post} onClose={() => setExpanded(false)} />}
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
}

export function PostResult({ results, loading, enabledPlatforms }: Props) {
  const platforms = PLATFORMS.filter(p => enabledPlatforms.includes(p.id));
  return (
    <div className="results-panel">
      {platforms.map(p => (
        <div key={p.id} className="result-col">
          {loading && !results[p.id] ? <SkeletonCard /> : null}
          {results[p.id] ? <PostCard post={results[p.id]!} /> : null}
        </div>
      ))}
    </div>
  );
}