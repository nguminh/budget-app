export function TopHeader({ eyebrow, title, profileInitials }) {
  return (
    <header className="top-header">
      <div>
        <div className="top-header__eyebrow">{eyebrow}</div>
        <h1 className="top-header__title">{title}</h1>
      </div>
      <button className="top-header__avatar" aria-label="Open profile">
        {profileInitials}
      </button>
    </header>
  )
}
