"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type DrillLibraryErrorBoundaryProps = {
  children: ReactNode;
};

type DrillLibraryErrorBoundaryState = {
  hasError: boolean;
};

export default class DrillLibraryErrorBoundary extends Component<
  DrillLibraryErrorBoundaryProps,
  DrillLibraryErrorBoundaryState
> {
  constructor(props: DrillLibraryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[drill-library] Failed to render drill library", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="mobile-card mx-4 mt-6 text-center md:mx-auto md:mt-10 md:max-w-lg">
          <p className="text-base text-zinc-200">
            Something went wrong loading the drill library. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#22c55e] px-5 text-sm font-semibold text-[#0A1628] transition hover:bg-[#35db72] md:w-auto"
          >
            Refresh Page
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
