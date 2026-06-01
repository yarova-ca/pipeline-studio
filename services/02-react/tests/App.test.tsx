import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../src/App'

describe('02-react', () => {
  it('renders hello', () => {
    render(<App />)
    expect(screen.getByText(/Hello from/i)).toBeDefined()
  })
})
