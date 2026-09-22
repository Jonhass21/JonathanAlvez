import { useState } from "react";
import { Modal } from "../common/Modal";

interface ClientFormModalProps {
  open: boolean;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function ClientFormModal(props: ClientFormModalProps) {
  if (!props.open) return null;
  return <ClientForm {...props} />;
}

function ClientForm({ open, initialName = "", onClose, onSubmit }: ClientFormModalProps) {
  const [name, setName] = useState(initialName);
  const editing = initialName.length > 0;

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Renombrar cliente" : "Nuevo cliente"}
      description={
        editing
          ? undefined
          : "El nombre es lo que el sistema va a reconocer cuando lo escribas en una tarea."
      }
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
          >
            {editing ? "Guardar" : "Agregar"}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="mb-1 block text-[11.5px] font-medium text-ink-tertiary">Nombre</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. San Lucas"
          className="w-full rounded-lg border border-border bg-base px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </form>
    </Modal>
  );
}
