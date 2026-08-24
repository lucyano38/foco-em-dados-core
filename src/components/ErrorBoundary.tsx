import { Component, ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback
      return (
        <div className="min-h-screen bg-[#0B1220] text-[#e3e2e2] font-sans antialiased flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm font-semibold text-red-300">Algo inesperado aconteceu ao carregar esta página.</p>
            <p className="mt-2 text-xs text-[#d4c5ab]">{this.state.error?.message || 'Erro de renderização'}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 h-10 px-4 rounded-lg bg-[#ffc107] hover:bg-[#ffca28] text-[#121414] text-xs font-bold"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
