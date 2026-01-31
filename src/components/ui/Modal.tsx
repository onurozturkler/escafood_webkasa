import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClose?: boolean;
  scroll?: 'inside' | 'body'; // 'inside' is default - scroll modal content, not body
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  disableBackdropClose = false,
  scroll = 'inside',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current active element for focus restoration
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Focus trap: focus the modal container
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;
        
        // Restore focus to previous element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disableBackdropClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Modal Panel */}
      <div
        ref={modalRef}
        className={`
          relative bg-white rounded-2xl shadow-lg w-full
          ${sizeClasses[size]}
          max-h-[90vh]
          flex flex-col
          focus:outline-none
        `}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 rounded-t-2xl z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-slate-900 m-0">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                text-slate-500 hover:text-slate-700 text-2xl leading-none
                w-10 h-10 min-w-[40px] min-h-[40px]
                flex items-center justify-center
                rounded-lg hover:bg-slate-100
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
              type="button"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className={`
            flex-1 overflow-y-auto
            px-4 sm:px-6 py-4
            ${footer ? 'pb-2' : 'pb-4'}
          `}
          style={{
            maxHeight: footer
              ? 'calc(90vh - 120px)' // Account for header (~60px) + footer (~60px)
              : 'calc(90vh - 80px)', // Account for header only
          }}
        >
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 rounded-b-2xl z-10 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

