import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Smoke Test', () => {
  it('renders without crashing and shows MESSAGES header', () => {
    render(<App />);
    expect(screen.getByText('MESSAGES')).toBeDefined();
  });
});
