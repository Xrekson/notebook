import type { Note } from './class/types';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Canvas from './components/Canvas';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";

const App: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const fetchNotes = async () => {
    try {
      const res = await axios.get<Note[]>('http://localhost:5000/api/notes');
      setNotes(res.data);
    } catch (error) {
      console.error('Failed to load notes', error);
    }
  };

  const handleDelete = async (_id: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/notes/${_id}`);
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (<>
  <PrimeReactProvider>
    <Sidebar visible={visible} onHide={() => setVisible(false)}>
      <h2>Saved Notes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {notes.map((note) => (
          <div
            key={note._id}
            style={{
              border: '1px solid gray',
              margin: 10,
              padding: 10,
              width: 220,
              textAlign: 'center',
            }}
          >
            <strong>{note.title}</strong>
            <img
              src={note.image}
              alt="Note"
              style={{ width: 200, height: 150, margin: '10px 0', cursor: 'pointer' }}
              onClick={() => setEditingNote(note)}
            />
            <div>
              <button onClick={() => setEditingNote(note)}>Edit</button>
              <button onClick={() => handleDelete(note._id)} style={{ marginLeft: 10, color: 'red' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Sidebar>
    <Button icon="pi pi-arrow-right" onClick={() => setVisible(true)} />
    <div style={{ padding: 20 }}>
      <h1>Notebook App (with titles, editing, and delete)</h1>
      <Canvas
        onSave={() => {
          fetchNotes();
          setEditingNote(null);
        }}
        backgroundImage={editingNote?.image || null}
        editingNoteId={editingNote?._id || null}
        initialTitle={editingNote?.title || ''}
      />
    </div>
    </PrimeReactProvider>
  </>
  );
};

export default App;
