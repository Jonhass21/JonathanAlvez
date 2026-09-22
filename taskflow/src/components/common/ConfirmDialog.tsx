import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
          >
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}
