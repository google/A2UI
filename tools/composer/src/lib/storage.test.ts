import { describe, it, expect, vi, beforeEach } from 'vitest';
import localforage from 'localforage';
import { getWidgets, saveWidget, deleteWidget } from './storage';
import { Widget } from '@/types/widget';

vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('storage', () => {
  const mockWidget: Widget = {
    id: '1',
    name: 'Test Widget',
    createdAt: new Date(),
    updatedAt: new Date(),
    root: 'root',
    components: [],
    dataStates: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWidgets', () => {
    it('should return empty array if no widgets in storage', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue(null);
      const widgets = await getWidgets();
      expect(widgets).toEqual([]);
    });

    it('should return widgets from storage', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([mockWidget]);
      const widgets = await getWidgets();
      expect(widgets).toEqual([mockWidget]);
    });
  });

  describe('saveWidget', () => {
    it('should add new widget if not exists', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([]);
      await saveWidget(mockWidget);
      expect(localforage.setItem).toHaveBeenCalledWith('widgets', [mockWidget]);
    });

    it('should update existing widget', async () => {
      const existingWidget = { ...mockWidget, name: 'Old Name' };
      vi.mocked(localforage.getItem).mockResolvedValue([existingWidget]);
      
      const updatedWidget = { ...mockWidget, name: 'New Name' };
      await saveWidget(updatedWidget);
      
      expect(localforage.setItem).toHaveBeenCalledWith('widgets', [updatedWidget]);
    });
  });

  describe('deleteWidget', () => {
    it('should remove widget from storage', async () => {
      vi.mocked(localforage.getItem).mockResolvedValue([mockWidget]);
      await deleteWidget('1');
      expect(localforage.setItem).toHaveBeenCalledWith('widgets', []);
    });
  });
});
