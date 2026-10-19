/** Знак «Лесной прокат»: две ели и костёр. Тот же рисунок — в src/app/icon.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M9 6L4.5 14H7L3.5 20H14.5L11 14H13.5Z" fill="#8fbf9a" />
      <rect x="8" y="20" width="2" height="3" fill="#8fbf9a" />
      <path d="M23 3L18 12H20.5L16.5 19H29.5L25.5 12H28Z" fill="#cfe3c9" />
      <rect x="22" y="19" width="2" height="4" fill="#cfe3c9" />
      <path d="M12.5 29.6L19.5 27.4M12.5 27.4L19.5 29.6" stroke="#c08457" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 28.2C12.6 26.4 13.2 23 15 20.6C15.3 22.6 16.6 23.2 17.2 21.8C19.4 24 19.4 27.4 16 28.2Z" fill="#f59e42" />
      <path d="M16 28.2C14.9 27.3 15.1 25.9 16 24.8C16.9 25.9 17.1 27.3 16 28.2Z" fill="#ffe08a" />
    </svg>
  );
}
