import classNames from 'classnames';
import { useCallback, useMemo, useRef } from 'react';
import invariant from 'invariant';
import useMergedRefs from '@restart/hooks/useMergedRefs';
import hasClass from 'dom-helpers/hasClass';
import { Offset, Options } from '@restart/ui/usePopper';
import { useBsPrefix } from './Theme';
import { Popover } from './Popover';
import { useCol, Props as _Props } from './Col';
import { Variant } from './types';

export function useOverlayOffset(
  customOffset?: Offset,
): [React.RefObject<HTMLElement>, Options['modifiers']] {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const popoverClass = useBsPrefix(undefined, 'popover');
  const offset = useMemo(
    () => ({
      name: 'offset',
      options: {
        offset: () => {
          if (
            overlayRef.current &&
            hasClass(overlayRef.current, popoverClass)
          ) {
            return customOffset || Popover.POPPER_OFFSET;
          }
          return customOffset || [0, 0];
        },
      },
    }),
    [customOffset, popoverClass],
  );
  return [overlayRef, [offset]];
}

export type Animation = 'glow' | 'wave';
export type Size = 'xs' | 'sm' | 'lg';

export interface Props extends Omit<_Props, 'as'> {
  animation?: Animation;
  bg?: Variant;
  size?: Size;
}

export function usePlaceholder({
  animation,
  bg,
  bsPrefix,
  size,
  ...ps
}: Props) {
  const bs = useBsPrefix(bsPrefix, 'placeholder');
  const [{ className, ...colProps }] = useCol(ps);

  return {
    ...colProps,
    className: classNames(
      className,
      animation ? `${bs}-${animation}` : bs,
      size && `${bs}-${size}`,
      bg && `bg-${bg}`,
    ),
  };
}

export function useWrappedRefWithWarning(ref, componentName) {
  // @ts-ignore
  if (!__DEV__) return ref;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const warningRef = useCallback(
    (refValue) => {
      invariant(
        refValue == null || !refValue.isReactComponent,
        `${componentName} injected a ref to a provided \`as\` component that resolved to a component instance instead of a DOM element. ` +
          'Use `React.forwardRef` to provide the injected ref to the class component as a prop in order to pass it directly to a DOM element',
      );
    },
    [componentName],
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMergedRefs(warningRef, ref);
}
