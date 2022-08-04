import classNames from 'classnames';
import * as React from 'react';
import { useUncontrolled } from 'uncontrollable';
import useEventCallback from '@restart/hooks/useEventCallback';
import Anchor from '@restart/ui/Anchor';
import { useBs } from './Theme';
import { Fade } from './Fade';
import { Close, Variant as CloseVariant } from './Button';
import { Variant } from './types';
import { divAs, withBs } from './utils';
import { TransitionType } from './helpers';

export const Link = withBs('alert-link', {
  Component: Anchor,
});

const DivAsH4 = divAs('h4');
DivAsH4.displayName = 'DivStyledAsH4';
export const Heading = withBs('alert-heading', {
  Component: DivAsH4,
});

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  bsPrefix?: string;
  variant?: Variant;
  dismissible?: boolean;
  show?: boolean;
  onClose?: (a: any, b: any) => void;
  closeLabel?: string;
  closeVariant?: CloseVariant;
  transition?: TransitionType;
}

export const Alert = React.forwardRef<HTMLDivElement, Props>(
  (xs: Props, ref) => {
    const {
      bsPrefix,
      show,
      closeLabel,
      closeVariant,
      className,
      children,
      variant,
      onClose,
      dismissible,
      transition,
      ...ps
    } = useUncontrolled(xs, {
      show: 'onClose',
    });
    const bs = useBs(bsPrefix, 'alert');
    const onClick = useEventCallback((e) => {
      if (onClose) {
        onClose(false, e);
      }
    });
    const X = transition === true ? Fade : transition;
    const alert = (
      <div
        role="alert"
        {...(!X ? ps : undefined)}
        ref={ref}
        className={classNames(
          className,
          bs,
          variant && `${bs}-${variant}`,
          dismissible && `${bs}-dismissible`,
        )}
      >
        {dismissible && (
          <Close
            onClick={onClick}
            aria-label={closeLabel}
            variant={closeVariant}
          />
        )}
        {children}
      </div>
    );
    if (!X) return show ? alert : null;
    return (
      <X unmountOnExit {...ps} ref={undefined} in={show}>
        {alert}
      </X>
    );
  },
);
Alert.displayName = 'Alert';
Alert.defaultProps = {
  variant: 'primary',
  show: true,
  transition: Fade,
  closeLabel: 'Close alert',
};
