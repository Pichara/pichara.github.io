/**
 * ErrorBoundary — catches render errors in the diagram editor so a failure
 * shows an error message with a way back instead of a blank page.
 *
 * Wrap the lazy /diagram route with it (see `src/main.tsx`). Without a
 * boundary, any error while the editor mounts unmounts the whole React
 * tree and the user sees only a black page.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Pichara Studio failed to load:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="studio-error" role="alert">
          <h1>Something went wrong in Pichara Studio</h1>
          <p>
            The diagram editor failed to load. Your saved diagram is still
            stored locally in this browser.
          </p>
          <Link to="/">← Back to portfolio</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
