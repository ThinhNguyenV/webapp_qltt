export default function Modal({ show, onClose, children, wide = false }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box glass ${wide ? 'wide' : ''}`}>
        {children}
      </div>
    </div>
  );
}
