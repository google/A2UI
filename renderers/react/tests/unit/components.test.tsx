/**
 * Component Unit Tests
 * Tests individual A2UI components render correctly
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { A2UIProvider } from '../../src/a2ui/context'
import { Text } from '../../src/a2ui/components/display/Text'
import { Button } from '../../src/a2ui/components/interactive/Button'
import { Card } from '../../src/a2ui/components/layout/Card'
import { Row } from '../../src/a2ui/components/layout/Row'
import { Column } from '../../src/a2ui/components/layout/Column'
import { CheckBox } from '../../src/a2ui/components/interactive/CheckBox'

// Helper to wrap components in A2UI context
const renderWithContext = (ui: React.ReactElement, data: Record<string, unknown> = {}) => {
  return render(
    <A2UIProvider data={data}>
      {ui}
    </A2UIProvider>
  )
}

// ===========================================================================
// Text Component Tests
// ===========================================================================

describe('Text Component', () => {
  it('renders plain text', () => {
    renderWithContext(<Text spec={{ id: 'test', component: 'Text', text: 'Hello World' }} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders with h1 usageHint', () => {
    renderWithContext(<Text spec={{ id: 'test', component: 'Text', text: 'Heading', usageHint: 'h1' }} />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Heading')
  })

  it('renders with h2 usageHint', () => {
    renderWithContext(<Text spec={{ id: 'test', component: 'Text', text: 'Subheading', usageHint: 'h2' }} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Subheading')
  })

  it('renders with caption usageHint', () => {
    renderWithContext(<Text spec={{ id: 'test', component: 'Text', text: 'Caption text', usageHint: 'caption' }} />)
    expect(screen.getByText('Caption text')).toBeInTheDocument()
  })

  it('renders data-bound text', () => {
    // Context uses dot notation for paths, not JSON Pointer
    renderWithContext(
      <Text spec={{ id: 'test', component: 'Text', text: { path: 'name' } }} />,
      { name: 'John Doe' }
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('handles Japanese text correctly', () => {
    renderWithContext(<Text spec={{ id: 'test', component: 'Text', text: '日本語テスト' }} />)
    expect(screen.getByText('日本語テスト')).toBeInTheDocument()
  })
})

// ===========================================================================
// Button Component Tests
// ===========================================================================

describe('Button Component', () => {
  it('renders button with text', () => {
    renderWithContext(
      <Button spec={{
        id: 'btn',
        component: 'Button',
        renderedChild: 'Click Me',
      }} />
    )
    expect(screen.getByRole('button')).toHaveTextContent('Click Me')
  })

  it('dispatches action on click', () => {
    const onAction = vi.fn()
    render(
      <A2UIProvider data={{}} onAction={onAction}>
        <Button spec={{
          id: 'btn',
          component: 'Button',
          renderedChild: 'Submit',
          action: { name: 'submit', context: { value: 'test' } },
        }} />
      </A2UIProvider>
    )

    fireEvent.click(screen.getByRole('button'))

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'submit',
        context: { value: 'test' },
      })
    )
  })

  it('renders primary button by default', () => {
    renderWithContext(
      <Button spec={{
        id: 'btn',
        component: 'Button',
        renderedChild: 'Primary',
      }} />
    )
    const button = screen.getByRole('button')
    // Primary buttons have filled primary background (not transparent)
    expect(button.style.background).not.toBe('transparent')
  })

  it('renders secondary button when primary=false', () => {
    renderWithContext(
      <Button spec={{
        id: 'btn',
        component: 'Button',
        renderedChild: 'Secondary',
        primary: false,
      }} />
    )
    const button = screen.getByRole('button')
    // Secondary buttons have transparent background with border
    expect(button).toHaveStyle({ background: 'transparent' })
  })
})

// ===========================================================================
// Card Component Tests
// ===========================================================================

describe('Card Component', () => {
  it('renders child content', () => {
    renderWithContext(
      <Card spec={{
        id: 'card',
        component: 'Card',
        renderedChild: <span>Card Content</span>,
      }} />
    )
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('applies card styling with shadow', () => {
    const { container } = renderWithContext(
      <Card spec={{
        id: 'card',
        component: 'Card',
        renderedChild: 'Content',
      }} />
    )
    const card = container.firstChild as HTMLElement
    expect(card.style.boxShadow).toBeTruthy()
    expect(card.style.borderRadius).toBeTruthy()
  })
})

// ===========================================================================
// Row Component Tests
// ===========================================================================

describe('Row Component', () => {
  it('renders children horizontally', () => {
    const { container } = renderWithContext(
      <Row spec={{
        id: 'row',
        component: 'Row',
        renderedChildren: [
          <span key="1">Item 1</span>,
          <span key="2">Item 2</span>,
        ],
      }} />
    )
    expect(container.querySelector('div')).toHaveStyle({ flexDirection: 'row' })
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('applies distribution style', () => {
    const { container } = renderWithContext(
      <Row spec={{
        id: 'row',
        component: 'Row',
        distribution: 'spaceEvenly',
        renderedChildren: [<span key="1">A</span>],
      }} />
    )
    expect(container.querySelector('div')).toHaveStyle({ justifyContent: 'space-evenly' })
  })

  it('applies alignment style', () => {
    const { container } = renderWithContext(
      <Row spec={{
        id: 'row',
        component: 'Row',
        alignment: 'center',
        renderedChildren: [<span key="1">A</span>],
      }} />
    )
    expect(container.querySelector('div')).toHaveStyle({ alignItems: 'center' })
  })
})

// ===========================================================================
// Column Component Tests
// ===========================================================================

describe('Column Component', () => {
  it('renders children vertically', () => {
    const { container } = renderWithContext(
      <Column spec={{
        id: 'col',
        component: 'Column',
        renderedChildren: [
          <span key="1">Row 1</span>,
          <span key="2">Row 2</span>,
        ],
      }} />
    )
    expect(container.querySelector('div')).toHaveStyle({ flexDirection: 'column' })
    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.getByText('Row 2')).toBeInTheDocument()
  })
})

// ===========================================================================
// CheckBox Component Tests
// ===========================================================================

describe('CheckBox Component', () => {
  it('renders unchecked by default', () => {
    renderWithContext(
      <CheckBox spec={{
        id: 'cb',
        component: 'CheckBox',
        label: 'Accept terms',
      }} />
    )
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('Accept terms')).toBeInTheDocument()
  })

  it('renders checked when value=true', () => {
    // CheckBox uses spec.value (not checked) for initial state
    renderWithContext(
      <CheckBox spec={{
        id: 'cb',
        component: 'CheckBox',
        label: 'Enabled',
        value: true,
      }} />
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('dispatches onChange action on change', () => {
    // CheckBox uses onChange (not action) for the callback
    const onAction = vi.fn()
    render(
      <A2UIProvider data={{}} onAction={onAction}>
        <CheckBox spec={{
          id: 'cb',
          component: 'CheckBox',
          label: 'Toggle',
          onChange: { name: 'toggle' },
        }} />
      </A2UIProvider>
    )

    fireEvent.click(screen.getByRole('checkbox'))

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'toggle',
        params: expect.objectContaining({ value: true }),
      })
    )
  })
})
