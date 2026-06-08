import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal>
      <div onClick={onClose} />
      <div>{children}</div>
    </div>
  );
}
