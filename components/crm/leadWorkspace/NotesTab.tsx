"use client";

import { useEffect, useRef, useState } from "react";
import {
  createNoteAction,
  deleteNoteAction,
  fetchNotes,
  updateNoteAction,
} from "@/application/crm/notesActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconTrash } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/domain/crm/format";
import type { LeadNote } from "@/types/crm";

const AUTOSAVE_DELAY_MS = 900;

function NoteCard({ note, onDeleted }: { note: LeadNote; onDeleted: (id: string) => void }) {
  const [body, setBody] = useState(note.body);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setBody(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (!value.trim() || value === note.body) return;
      setSaving(true);
      const result = await updateNoteAction(note.id, value);
      setSaving(false);
      if (result.ok) setSavedAt(Date.now());
    }, AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleDelete() {
    if (!window.confirm("Excluir esta nota?")) return;
    await deleteNoteAction(note.id);
    onDeleted(note.id);
  }

  return (
    <div className="crm-note-card">
      <div className="crm-note-meta">
        <span>
          {note.createdByName ?? "Sistema"} · {formatDateTime(note.createdAt)}
          {note.updatedAt !== note.createdAt && " · editada"}
        </span>
        <div className="crm-note-actions">
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>
            {saving ? "Salvando…" : savedAt ? "Salvo" : ""}
          </span>
          <button type="button" onClick={handleDelete} aria-label="Excluir nota">
            <IconTrash size={13} />
          </button>
        </div>
      </div>
      <div className="crm-note-body">
        <textarea value={body} onChange={(e) => handleChange(e.target.value)} rows={3} />
      </div>
    </div>
  );
}

export function NotesTab({ crmLeadId }: { crmLeadId: string }) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchNotes(crmLeadId).then((data) => {
      if (!cancelled) {
        setNotes(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSubmitting(true);
    const result = await createNoteAction(crmLeadId, draft);
    setSubmitting(false);
    if (result.ok && result.note) {
      setNotes((prev) => [result.note as LeadNote, ...prev]);
      setDraft("");
    }
  }

  function handleDeleted(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 70, marginBottom: 16 }} />
        <Skeleton style={{ height: 60, marginBottom: 10 }} />
        <Skeleton style={{ height: 60 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="crm-ws-composer">
        <textarea
          placeholder="Escreva uma nota…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />
        <div className="crm-composer-actions">
          <span className="crm-card-sub" style={{ margin: 0 }}>
            {notes.length} nota{notes.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="btn btn-accent"
            disabled={submitting || !draft.trim()}
            onClick={handleAdd}
          >
            {submitting ? "Adicionando…" : "Adicionar nota"}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">📝</EmptyMedia>
          <EmptyTitle>Nenhuma nota ainda</EmptyTitle>
          <EmptyDescription>Registre observações sobre este lead acima.</EmptyDescription>
        </Empty>
      ) : (
        notes.map((note) => <NoteCard key={note.id} note={note} onDeleted={handleDeleted} />)
      )}
    </div>
  );
}
