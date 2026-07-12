'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AgenticQuest ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-infinity-magenta" />
          <p className="text-infinity-ink-dim">Something went wrong in the quest interface.</p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
