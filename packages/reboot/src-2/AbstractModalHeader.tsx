import * as React from 'react';
import { useContext } from 'react';
import useEventCallback from '@restart/hooks/useEventCallback';
import { CloseButton, Variant } from './CloseButton';
import ModalContext from './ModalContext';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  closeLabel?: string;
  closeVariant?: Variant;
  closeButton?: boolean;
  onHide?: () => void;
}

export const AbstractModalHeader = React.forwardRef<HTMLDivElement, Props>(
  ({ closeLabel, closeVariant, closeButton, onHide, children, ...ps }, ref) => {
    const context = useContext(ModalContext);
    const handleClick = useEventCallback(() => {
      context?.onHide();
      onHide?.();
    });
    return (
      <div ref={ref} {...ps}>
        {children}
        {closeButton && (
          <CloseButton
            aria-label={closeLabel}
            variant={closeVariant}
            onClick={handleClick}
          />
        )}
      </div>
    );
  },
);

AbstractModalHeader.defaultProps = {
  closeLabel: 'Close',
  closeButton: false,
};
