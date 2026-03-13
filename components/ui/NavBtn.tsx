'use client';

interface Props {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function NavBtn({ icon, label, onClick, active }: Props) {
  return (
    <button className={`nav-btn ${active ? 'nav-btn-active' : ''}`} onClick={onClick} title={label}>
      <span className="nav-btn-icon">{icon}</span>
      <span className="nav-btn-label">{label}</span>
    </button>
  );
}
