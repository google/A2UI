import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EditorHeader } from './editor-header';
import { Widget } from '@/types/widget';
import React from 'react';

describe('EditorHeader', () => {
  const mockWidget: Widget = {
    id: 'test-id',
    name: 'Test Widget',
    createdAt: new Date(),
    updatedAt: new Date(),
    root: 'root',
    components: [{ id: 'root', component: { Text: { text: { literalString: 'Hello' } } } }],
    dataStates: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('should render widget name', () => {
    render(<EditorHeader widget={mockWidget} />);
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });

  it('should copy JSON to clipboard when clicking Copy JSON', async () => {
    render(<EditorHeader widget={mockWidget} />);
    const copyButton = screen.getByText('Copy JSON');
    
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockWidget.components, null, 2)
    );
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('should call createObjectURL when clicking Download', () => {
    // Just verify the URL creation, don't mess with DOM methods that React needs
    render(<EditorHeader widget={mockWidget} />);
    const downloadButton = screen.getByText('Download');
    
    fireEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
