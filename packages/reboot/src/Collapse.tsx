import classNames from 'classnames';
import * as React from 'react';
import css from 'dom-helpers/css';
import { useMemo } from 'react';
import Transition, {
  TransitionStatus,
  ENTERED,
  ENTERING,
  EXITED,
  EXITING,
} from 'react-transition-group/Transition';
import { TransitionCallbacks } from '@restart/ui/types';
import { triggerReflow, createChained, endListener } from './utils';
import { Wrapper } from './Transition';

type Dimension = 'height' | 'width';

export interface Props
  extends TransitionCallbacks,
    Pick<React.HTMLAttributes<HTMLElement>, 'role'> {
  className?: string;
  in?: boolean;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  appear?: boolean;
  timeout?: number;
  dimension?: Dimension | (() => Dimension);
  getDimensionValue?: (dimension: Dimension, element: HTMLElement) => number;
  children: React.ReactElement;
}

const MARGINS: { [d in Dimension]: string[] } = {
  height: ['marginTop', 'marginBottom'],
  width: ['marginLeft', 'marginRight'],
};

function getDefaultDimensionValue(
  dimension: Dimension,
  elem: HTMLElement,
): number {
  const offset = `offset${dimension[0].toUpperCase()}${dimension.slice(1)}`;
  const value = elem[offset];
  const margins = MARGINS[dimension];
  return (
    value +
    // @ts-ignore
    parseInt(css(elem, margins[0]), 10) +
    // @ts-ignore
    parseInt(css(elem, margins[1]), 10)
  );
}

const collapseStyles = {
  [EXITED]: 'collapse',
  [EXITING]: 'collapsing',
  [ENTERING]: 'collapsing',
  [ENTERED]: 'collapse show',
};

export const Collapse = React.forwardRef<Transition<any>, Props>(
  (
    {
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      className,
      children,
      dimension = 'height',
      getDimensionValue = getDefaultDimensionValue,
      ...ps
    },
    ref,
  ) => {
    const dim = typeof dimension === 'function' ? dimension() : dimension;
    const enter = useMemo(
      () =>
        createChained((x) => {
          x.style[dim] = '0';
        }, onEnter),
      [dim, onEnter],
    );
    const entering = useMemo(
      () =>
        createChained((x) => {
          const scroll = `scroll${dim[0].toUpperCase()}${dim.slice(1)}`;
          x.style[dim] = `${x[scroll]}px`;
        }, onEntering),
      [dim, onEntering],
    );
    const entered = useMemo(
      () =>
        createChained((x) => {
          x.style[dim] = null;
        }, onEntered),
      [dim, onEntered],
    );
    const exit = useMemo(
      () =>
        createChained((x) => {
          x.style[dim] = `${getDimensionValue(dim, x)}px`;
          triggerReflow(x);
        }, onExit),
      [onExit, getDimensionValue, dim],
    );
    const exiting = useMemo(
      () =>
        createChained((x) => {
          x.style[dim] = null;
        }, onExiting),
      [dim, onExiting],
    );
    return (
      <Wrapper
        ref={ref}
        addEndListener={endListener}
        {...ps}
        aria-expanded={ps.role ? ps.in : null}
        onEnter={enter}
        onEntering={entering}
        onEntered={entered}
        onExit={exit}
        onExiting={exiting}
        childRef={(children as any).ref}
      >
        {(state: TransitionStatus, innerProps: Record<string, unknown>) =>
          React.cloneElement(children, {
            ...innerProps,
            className: classNames(
              className,
              children.props.className,
              collapseStyles[state],
              dim === 'width' && 'collapse-horizontal',
            ),
          })
        }
      </Wrapper>
    );
  },
);
Collapse.defaultProps = {
  in: false,
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  getDimensionValue: getDefaultDimensionValue,
};
