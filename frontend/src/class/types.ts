export interface LineData {
  tool: Tool;
  points: number[];
  color: string;
  strokeWidth: number;
  pressures?: number[]; // For pressure-sensitive drawing
}

export type Tool = 'pen' | 'pencil' | 'eraser';

export interface Note {
  _id: string;
  title: string;
  image: string;
  createdAt: string;
}

export interface CanvasProps {
  onSave?: () => void;
  backgroundImage?: string | null; // base64 image
  editingNoteId?: string | null;
  initialTitle?: string;
}