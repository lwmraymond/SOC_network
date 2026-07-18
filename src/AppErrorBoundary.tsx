import { Component, type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryProps = { children: ReactNode };
type AppErrorBoundaryState = { error: Error | null };

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render failure', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatalError" role="alert" aria-live="assertive">
          <h1>Application failed to render</h1>
          <p>
            The interface encountered an unexpected runtime error. No production
            mutation was submitted.
          </p>
          <details>
            <summary>Technical details</summary>
            <pre>{this.state.error.message}</pre>
          </details>
          <button type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
