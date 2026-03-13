'use client';
import type { HistoryEntry, Platform } from '@/types';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { LinkedInIcon, XIcon, InstagramIcon, CopyIcon, CheckIcon, TrashIcon } from '@/components/icons';
import { formatTimestamp } from '@/lib/utils';
import { PLATFORMS } from '@/lib/constants';

const PLATFORM_ICONS: Record<Platform, React.FC<{ className?: string }>> = {
  linkedin: LinkedInIcon,
  x: XIcon,
  instagram: InstagramIcon,
};

// Per-platform copy button with its own hook instance
function CopyBtn({ content }: { content: string }) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <button className="icon-btn-sm" onClick={() => copy(content)} title="Copy">
      {copied
        ? <CheckIcon className="icon-btn-svg-sm check-green" />
        : <CopyIcon className="icon-btn-svg-sm" />
      }
    </button>
  );
}

interface Props {
  history: HistoryEntry[];
  onClear: () => void;
}

export function HistoryPanel({ history, onClear }: Props) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        <p>No posts generated yet.</p>
        <p className="history-empty-sub">Generated posts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <span className="history-count">{history.length} generation{history.length !== 1 ? 's' : ''}</span>
        <button className="clear-btn" onClick={onClear}>
          <TrashIcon className="clear-icon" />
          Clear all
        </button>
      </div>
      <div className="history-list">
        {history.map(entry => {
          const platforms = PLATFORMS.filter(p => entry.results[p.id]);
          return (
            <div key={entry.id} className="history-item fadeUp">
              <div className="history-item-meta">
                <span className="history-topic">{entry.request.topic}</span>
                <span className="history-time">{formatTimestamp(entry.timestamp)}</span>
              </div>
              <div className="history-platforms">
                {platforms.map(p => {
                  const post = entry.results[p.id]!;
                  const Icon = PLATFORM_ICONS[p.id];
                  return (
                    <div key={p.id} className="history-platform-row">
                      <Icon className={`history-platform-icon ${p.colorClass}`} />
                      <p className="history-preview">{post.content.slice(0, 120)}…</p>
                      <CopyBtn content={post.content} />
                    </div>
                  );
                })}
              </div>
              <div className="history-pills">
                {platforms.map(p => (
                  <span key={p.id} className="mini-pill">{p.label}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}