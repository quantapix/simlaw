import contains from 'dom-helpers/contains';
import * as React from 'react';
import { cloneElement, useCallback, useRef } from 'react';
import useTimeout from '@restart/hooks/useTimeout';
import warning from 'warning';
import { useUncontrolledProp } from 'uncontrollable';
import useMergedRefs from '@restart/hooks/useMergedRefs';
import { Children, Overlay, Props as _Props } from './Overlay';
import { safeFindDOMNode } from './utils';

export type TriggerType = 'hover' | 'click' | 'focus';

export type Delay = number | { show: number; hide: number };

export type InjectedProps = {
  onFocus?: (...args: any[]) => any;
};

export type RenderProps = InjectedProps & {
  ref: React.Ref<any>;
};

export interface Props extends Omit<_Props, 'children' | 'target'> {
  children: React.ReactElement | ((ps: RenderProps) => React.ReactNode);
  trigger?: TriggerType | TriggerType[];
  delay?: Delay;
  show?: boolean;
  defaultShow?: boolean;
  onToggle?: (nextShow: boolean) => void;
  flip?: boolean;
  overlay: Children;
  target?: never;
  onHide?: never;
}

function normalizeDelay(delay?: Delay) {
  return delay && typeof delay === 'object'
    ? delay
    : {
        show: delay,
        hide: delay,
      };
}

function handleMouseOverOut(
  handler: (...xs: [React.MouseEvent, ...any[]]) => any,
  args: [React.MouseEvent, ...any[]],
  relatedNative: 'fromElement' | 'toElement',
) {
  const [e] = args;
  const target = e.currentTarget;
  const related = e.relatedTarget || e.nativeEvent[relatedNative];
  if ((!related || related !== target) && !contains(target, related)) {
    handler(...args);
  }
}

export const OverlayTrigger = ({
  trigger,
  overlay,
  children,
  popperConfig = {},
  show: propsShow,
  defaultShow = false,
  onToggle,
  delay: propsDelay,
  placement,
  flip = placement && placement.indexOf('auto') !== -1,
  ...ps
}: Props) => {
  const triggerNodeRef = useRef(null);
  const mergedRef = useMergedRefs<unknown>(
    triggerNodeRef,
    (children as any).ref,
  );
  const timeout = useTimeout();
  const hoverStateRef = useRef<string>('');
  const [show, setShow] = useUncontrolledProp(propsShow, defaultShow, onToggle);
  const delay = normalizeDelay(propsDelay);
  const { onFocus, onBlur, onClick } =
    typeof children !== 'function'
      ? React.Children.only(children).props
      : ({} as any);
  const attachRef = (r: React.ComponentClass | Element | null | undefined) => {
    mergedRef(safeFindDOMNode(r));
  };
  const handleShow = useCallback(() => {
    timeout.clear();
    hoverStateRef.current = 'show';
    if (!delay.show) {
      setShow(true);
      return;
    }
    timeout.set(() => {
      if (hoverStateRef.current === 'show') setShow(true);
    }, delay.show);
  }, [delay.show, setShow, timeout]);
  const handleHide = useCallback(() => {
    timeout.clear();
    hoverStateRef.current = 'hide';
    if (!delay.hide) {
      setShow(false);
      return;
    }
    timeout.set(() => {
      if (hoverStateRef.current === 'hide') setShow(false);
    }, delay.hide);
  }, [delay.hide, setShow, timeout]);
  const handleFocus = useCallback(
    (...args: any[]) => {
      handleShow();
      onFocus?.(...args);
    },
    [handleShow, onFocus],
  );
  const handleBlur = useCallback(
    (...args: any[]) => {
      handleHide();
      onBlur?.(...args);
    },
    [handleHide, onBlur],
  );
  const handleClick = useCallback(
    (...args: any[]) => {
      setShow(!show);
      onClick?.(...args);
    },
    [onClick, setShow, show],
  );
  const handleMouseOver = useCallback(
    (...args: [React.MouseEvent, ...any[]]) => {
      handleMouseOverOut(handleShow, args, 'fromElement');
    },
    [handleShow],
  );
  const handleMouseOut = useCallback(
    (...args: [React.MouseEvent, ...any[]]) => {
      handleMouseOverOut(handleHide, args, 'toElement');
    },
    [handleHide],
  );
  const triggers: string[] = trigger == null ? [] : [].concat(trigger as any);
  const triggerProps: any = {
    ref: attachRef,
  };
  if (triggers.indexOf('click') !== -1) {
    triggerProps.onClick = handleClick;
  }
  if (triggers.indexOf('focus') !== -1) {
    triggerProps.onFocus = handleFocus;
    triggerProps.onBlur = handleBlur;
  }
  if (triggers.indexOf('hover') !== -1) {
    warning(
      triggers.length > 1,
      '[react-bootstrap] Specifying only the `"hover"` trigger limits the visibility of the overlay to just mouse users. Consider also including the `"focus"` trigger so that touch and keyboard only users can see the overlay as well.',
    );
    triggerProps.onMouseOver = handleMouseOver;
    triggerProps.onMouseOut = handleMouseOut;
  }
  return (
    <>
      {typeof children === 'function'
        ? children(triggerProps)
        : cloneElement(children, triggerProps)}
      <Overlay
        {...ps}
        show={show}
        onHide={handleHide}
        flip={flip}
        placement={placement}
        popperConfig={popperConfig}
        target={triggerNodeRef.current}
      >
        {overlay}
      </Overlay>
    </>
  );
};

OverlayTrigger.defaultProps = {
  defaultShow: false,
  trigger: ['hover', 'focus'],
};
