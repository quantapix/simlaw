import * as React from 'react';
import { useRef } from 'react';
import classNames from 'classnames';
import BaseOverlay, {
  OverlayProps as BaseOverlayProps,
  OverlayArrowProps,
} from '@restart/ui/Overlay';
import { State } from '@restart/ui/usePopper';
import useCallbackRef from '@restart/hooks/useCallbackRef';
import useEventCallback from '@restart/hooks/useEventCallback';
import useIsomorphicEffect from '@restart/hooks/useIsomorphicEffect';
import useMergedRefs from '@restart/hooks/useMergedRefs';
import useOverlayOffset from './useOverlayOffset';
import { Fade } from './Fade';
import { TransitionType } from './helpers';
import { Placement, PopperRef, RootCloseEvent } from './types';
import safeFindDOMNode from './safeFindDOMNode';

export interface InjectedProps {
  ref: React.RefCallback<HTMLElement>;
  style: React.CSSProperties;
  'aria-labelledby'?: string;
  arrowProps: Partial<OverlayArrowProps>;
  show: boolean;
  placement: Placement | undefined;
  popper: PopperRef;
  [prop: string]: any;
}

export type Children =
  | React.ReactElement<InjectedProps>
  | ((injected: InjectedProps) => React.ReactNode);

export interface Props
  extends Omit<BaseOverlayProps, 'children' | 'transition' | 'rootCloseEvent'> {
  children: Children;
  transition?: TransitionType;
  placement?: Placement;
  rootCloseEvent?: RootCloseEvent;
}

function wrapRefs(props, arrowProps) {
  const { ref } = props;
  const { ref: aRef } = arrowProps;

  props.ref = ref.__wrapped || (ref.__wrapped = (r) => ref(safeFindDOMNode(r)));
  arrowProps.ref =
    aRef.__wrapped || (aRef.__wrapped = (r) => aRef(safeFindDOMNode(r)));
}

export const Overlay = React.forwardRef<HTMLElement, Props>(
  (
    { children: overlay, transition, popperConfig = {}, ...outerProps },
    outerRef,
  ) => {
    const popperRef = useRef<Partial<PopperRef>>({});
    const [firstRenderedState, setFirstRenderedState] = useCallbackRef<State>();
    const [ref, modifiers] = useOverlayOffset(outerProps.offset);
    const mergedRef = useMergedRefs(outerRef, ref);
    const actualTransition =
      transition === true ? Fade : transition || undefined;
    const handleFirstUpdate = useEventCallback((state) => {
      setFirstRenderedState(state);
      popperConfig?.onFirstUpdate?.(state);
    });
    useIsomorphicEffect(() => {
      if (firstRenderedState) {
        popperRef.current.scheduleUpdate?.();
      }
    }, [firstRenderedState]);
    return (
      <BaseOverlay
        {...outerProps}
        ref={mergedRef}
        popperConfig={{
          ...popperConfig,
          modifiers: modifiers.concat(popperConfig.modifiers || []),
          onFirstUpdate: handleFirstUpdate,
        }}
        transition={actualTransition}
      >
        {(overlayProps, { arrowProps, popper: popperObj, show }) => {
          wrapRefs(overlayProps, arrowProps);
          const updatedPlacement = popperObj?.placement;
          const popper = Object.assign(popperRef.current, {
            state: popperObj?.state,
            scheduleUpdate: popperObj?.update,
            placement: updatedPlacement,
            outOfBoundaries:
              popperObj?.state?.modifiersData.hide?.isReferenceHidden || false,
          });
          if (typeof overlay === 'function')
            return overlay({
              ...overlayProps,
              placement: updatedPlacement,
              show,
              ...(!transition && show && { className: 'show' }),
              popper,
              arrowProps,
            });
          return React.cloneElement(overlay as React.ReactElement, {
            ...overlayProps,
            placement: updatedPlacement,
            arrowProps,
            popper,
            className: classNames(
              (overlay as React.ReactElement).props.className,
              !transition && show && 'show',
            ),
            style: {
              ...(overlay as React.ReactElement).props.style,
              ...overlayProps.style,
            },
          });
        }}
      </BaseOverlay>
    );
  },
);

Overlay.displayName = 'Overlay';
Overlay.defaultProps = {
  transition: Fade,
  rootClose: false,
  show: false,
  placement: 'top',
};
