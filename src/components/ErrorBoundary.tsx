import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            className="error-boundary__button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="error-boundary__details">
              <summary>Error details (development only)</summary>
              <pre>{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;