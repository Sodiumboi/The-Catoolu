import { Component } from 'react';

// React error boundaries MUST be class components. Catches render/lifecycle
// errors in the subtree below it and shows a contained recovery panel instead
// of letting a single throw white-screen the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { error, showDetails } = this.state;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', textAlign: 'center',
        background: 'var(--bg-page, #1C1C1A)',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{
          maxWidth: 460, width: '100%',
          background: 'var(--bg-card, #26261F)',
          border: '1px solid var(--border-main, #3A3A37)',
          borderRadius: 'var(--radius-card, 8px)',
          boxShadow: 'var(--shadow-dropdown)',
          padding: '28px 24px',
        }}>
          <span className="icon" style={{ fontSize: 44, color: 'var(--danger, #E24B4A)' }}>
            error
          </span>
          <h1 style={{
            margin: '12px 0 8px', fontFamily: 'var(--font-serif)',
            fontSize: 22, color: 'var(--text-primary, #EAF3DE)',
          }}>
            Something went wrong
          </h1>
          <p style={{
            margin: '0 0 20px', fontSize: 14, lineHeight: 1.6,
            color: 'var(--text-secondary, #888780)',
          }}>
            Part of the app crashed. Try reloading.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ margin: '0 auto' }}>
            Reload
          </button>

          {error && (
            <div style={{ marginTop: 18, textAlign: 'left' }}>
              <button
                type="button"
                onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                aria-expanded={showDetails}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted, #888780)', fontSize: 12,
                  fontFamily: 'var(--font-sans)', padding: '2px 0',
                }}>
                <span className="icon" style={{
                  fontSize: 16,
                  transition: 'transform 200ms ease-in-out',
                  transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  expand_more
                </span>
                Technical details
              </button>

              {showDetails && (
                <pre style={{
                  marginTop: 8, maxHeight: 200, overflow: 'auto',
                  background: 'var(--bg-input, #1C1C1A)',
                  border: '0.5px solid var(--border-main, #3A3A37)',
                  borderRadius: 'var(--radius-squircle-inner, 5px)',
                  padding: '9px 11px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word', color: 'var(--text-muted, #888780)',
                }}>
                  {error.message}
                  {error.stack ? `\n\n${error.stack}` : ''}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
