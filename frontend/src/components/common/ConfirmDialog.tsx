import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Delete', loading }: Props) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className="btn-danger" disabled={loading}>
          {loading ? 'Deleting...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
