import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

// C-7: an error boundary so no failure is swallowed; the user sees a state.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return <p role="alert">Something went wrong. Please retry.</p>
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
