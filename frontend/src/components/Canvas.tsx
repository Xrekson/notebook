import type { LineData, Tool, CanvasProps } from '../class/types';
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage, Group } from 'react-konva';
import Konva from 'konva';
import { ChromePicker } from 'react-color';
import axios from 'axios';
import useImage from 'use-image';

const Canvas: React.FC<CanvasProps> = ({ onSave, backgroundImage, editingNoteId, initialTitle = '' }) => {
    const [lines, setLines] = useState<LineData[]>([]);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#000000');
    const [title, setTitle] = useState(initialTitle);
    const isDrawing = useRef(false);
    const lastPressure = useRef(0.5); // Default medium pressure
    const stageRef = useRef<any>(null);
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });


    const [bgImage] = useImage(backgroundImage || '');
    const [pencilTexture] = useImage('/pencil-texture.png'); // Add a pencil texture image

    useEffect(() => {
        setLines([]);
        setTitle(initialTitle);
    }, [backgroundImage, initialTitle]);

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        isDrawing.current = true;
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Get pressure from pointer event (0-1)
        const pressure = (e.evt as PointerEvent).pressure || 0.5;
        lastPressure.current = pressure;

        setLines(prev => [...prev, {
            tool,
            points: [pos.x, pos.y],
            color: tool === 'eraser' ? '#ffffff' : color,
            strokeWidth: getStrokeWidth(tool, pressure),
            pressures: [pressure]
        }]);
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        // Get current pressure
        const pressure = (e.evt as PointerEvent).pressure || lastPressure.current;
        lastPressure.current = pressure;

        setLines(prev => {
            const lastLine = prev[prev.length - 1];
            const updatedLine = {
                ...lastLine,
                points: [...lastLine.points, point.x, point.y],
                strokeWidth: getStrokeWidth(tool, pressure),
                pressures: [...(lastLine.pressures || []), pressure]
            };
            return [...prev.slice(0, -1), updatedLine];
        });
    };

    const getStrokeWidth = (currentTool: Tool, pressure: number): number => {
        switch (currentTool) {
            case 'pencil':
                return 1 + (pressure * 3); // 1-4 range
            case 'pen':
                return 0.5 + (pressure * 3.5); // 0.5-4 range
            case 'eraser':
                return 5 + (pressure * 15); // 5-20 range
            default:
                return 2;
        }
    };

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setStageScale(newScale);
        setStagePos(newPos);
    };


    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    // Render pencil with texture effect
    const renderPencilLine = (line: LineData, i: number) => {
        return (
            <Group key={i}>
                {/* Base line */}
                <Line
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    tension={0.1} // Adds slight irregularity to pencil lines
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                    opacity={0.8}
                />
                {/* Texture overlay */}
                {pencilTexture && (
                    <Line
                        points={line.points}
                        stroke="rgba(100, 100, 100, 0.3)"
                        strokeWidth={line.strokeWidth * 1.2}
                        lineCap="round"
                        lineJoin="round"
                        dash={[1, 2]} // Creates a slightly broken line effect
                        globalCompositeOperation="overlay"
                    />
                )}
                {/* Pressure-sensitive shading */}
                <Line
                    points={line.points}
                    stroke="rgba(0, 0, 0, 0.1)"
                    strokeWidth={line.strokeWidth * 1.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="multiply"
                />
            </Group>
        );
    };

    // Render pen with smooth pressure-sensitive lines
    const renderPenLine = (line: LineData, i: number) => {
        return (
            <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0}
                lineCap="round"
                lineJoin="round"
                shadowColor={line.color}
                shadowBlur={line.strokeWidth / 2}
                shadowOpacity={0.3}
                opacity={0.9 + (lastPressure.current * 0.1)} // 0.9-1.0 opacity range
            />
        );
    };

    // Render eraser
    const renderEraserLine = (line: LineData, i: number) => {
        return (
            <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="destination-out"
                opacity={0.7}
            />
        );
    };

    const renderLine = (line: LineData, i: number) => {
        switch (line.tool) {
            case 'pencil': return renderPencilLine(line, i);
            case 'pen': return renderPenLine(line, i);
            case 'eraser': return renderEraserLine(line, i);
            default: return renderPenLine(line, i);
        }
    };

    const handleSave = async () => {
        const uri = (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/png');
        try {
            const payload: any = {
                image: uri,
                title
            };
            if (editingNoteId) payload._id = editingNoteId;

            await axios.post('http://localhost:5000/api/notes/save', payload);
            alert(editingNoteId ? 'Note updated!' : 'Note saved!');
            onSave?.();
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const handleClear = () => setLines([]);

    const handleDownload = () => {
        const uri = (document.querySelector('canvas') as HTMLCanvasElement).toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'note.png';
        link.href = uri;
        link.click();
    };

    return (
        <div>
            <div style={{ marginBottom: 10 }}>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Note title"
                    style={{ marginRight: 10, padding: '4px 8px', width: 200 }}
                />

                <label>Tool:</label>
                <select onChange={(e) => setTool(e.target.value as Tool)} value={tool}>
                    <option value="pen">Pen</option>
                    <option value="pencil">Pencil</option>
                    <option value="eraser">Eraser</option>
                </select>

                {tool !== 'eraser' && (
                    <div style={{ display: 'inline-block', marginLeft: 20 }}>
                        <ChromePicker color={color} onChange={(updatedColor) => setColor(updatedColor.hex)} />
                    </div>
                )}

                <button style={{ marginLeft: 20 }} onClick={handleSave}>Save</button>
                <button style={{ marginLeft: 10 }} onClick={handleClear}>Clear</button>
                <button style={{ marginLeft: 10 }} onClick={handleDownload}>Download PNG</button>
            </div>

            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight - 100}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                onWheel={handleWheel}
                draggable
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDragEnd={(e) => {
                    setStagePos(e.currentTarget.position());
                }}
                style={{ border: '1px solid black', background: 'white' }}
            >
                <Layer>
                    {bgImage && <KonvaImage image={bgImage} width={600} height={400} />}
                    {lines.map((line, i) => renderLine(line, i))}
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;