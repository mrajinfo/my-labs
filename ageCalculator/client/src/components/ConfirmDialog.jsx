import { Button } from './ui/Button.jsx';
import { Dialog, DialogFooter } from './ui/Dialog.jsx';

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} width="27rem">
      <DialogFooter>
        <Button variant="secondary" onClick={onClose} data-autofocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
