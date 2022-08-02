import classNames from 'classnames';
import * as React from 'react';
import { useUncontrolled } from 'uncontrollable';
import useEventCallback from '@restart/hooks/useEventCallback';
import Anchor from '@restart/ui/Anchor';
import { useBootstrapPrefix } from './ThemeProvider';
import { Fade } from './Fade';
import { Close as CloseButton, Variant as CloseVariant } from './Button';
import { Variant } from './types';
import divWithClassName from './divWithClassName';
import createWithBsPrefix from './createWithBsPrefix';
import { TransitionType } from './helpers';

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
    const bs = useBootstrapPrefix(bsPrefix, 'alert');
    const handleClose = useEventCallback((e) => {
      if (onClose) {
        onClose(false, e);
      }
    });
    const Transition = transition === true ? Fade : transition;
    const alert = (
      <div
        role="alert"
        {...(!Transition ? ps : undefined)}
        ref={ref}
        className={classNames(
          className,
          bs,
          variant && `${bs}-${variant}`,
          dismissible && `${bs}-dismissible`,
        )}
      >
        {dismissible && (
          <CloseButton
            onClick={handleClose}
            aria-label={closeLabel}
            variant={closeVariant}
          />
        )}
        {children}
      </div>
    );
    if (!Transition) return show ? alert : null;
    return (
      <Transition unmountOnExit {...ps} ref={undefined} in={show}>
        {alert}
      </Transition>
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

const Div = divWithClassName('h4');
Div.displayName = 'DivStyledAsH4';

Object.assign(Alert, {
  Link: createWithBsPrefix('alert-link', {
    Component: Anchor,
  }),
  Heading: createWithBsPrefix('alert-heading', {
    Component: Div,
  }),
});
