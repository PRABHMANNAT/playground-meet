import { Dialog } from './dialog';
export function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="A few little shortcuts">
      {[
        ['M', 'Toggle microphone'],
        ['V', 'Toggle camera'],
        ['S', 'Share your screen'],
        ['H', 'Raise or lower hand'],
        ['C', 'Open chat'],
        ['?', 'Show shortcuts'],
        ['Esc', 'Close side panel'],
      ].map(([key, label]) => (
        <div className="shortcut-row" key={key}>
          <span>{label}</span>
          <kbd>{key}</kbd>
        </div>
      ))}
    </Dialog>
  );
}
