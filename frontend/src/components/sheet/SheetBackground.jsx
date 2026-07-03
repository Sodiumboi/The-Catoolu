// ── SheetBackground ──────────────────────────────────────────────────
// Engine-only background-art hook — NO art yet (artist not yet contacted).
//
// When the art is ready, set the --sheet-bg-art CSS variable (per theme,
// in index.css) — e.g. url('/assets/sheet-bg-dark.png'). This component
// already pipes that variable into background-image, so nothing here needs
// to change. While --sheet-bg-art is `none`, this renders as a transparent
// passthrough around its children.

const SheetBackground = ({ theme, children, className = '', style }) => (
  <div
    className={`sheet-background relative bg-cover bg-center bg-no-repeat [background-image:var(--sheet-bg-art,_none)] ${className}`.trim()}
    data-theme={theme}
    style={style}
  >
    {children}
  </div>
);

export default SheetBackground;
