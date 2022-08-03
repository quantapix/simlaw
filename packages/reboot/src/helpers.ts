import * as React from 'react';
import { TransitionComponent } from '@restart/ui/types';

export type Omit<T, U> = Pick<T, Exclude<keyof T, keyof U>>;

export type ReplaceProps<T extends React.ElementType, P> = Omit<
  React.ComponentPropsWithRef<T>,
  P
> &
  P;

export interface BsOnlyProps {
  bsPrefix?: string;
}

export interface AsProp<T extends React.ElementType = React.ElementType> {
  as?: T;
}

export interface BsProps<T extends React.ElementType = React.ElementType>
  extends BsOnlyProps,
    AsProp<T> {}

export interface BsRefComponent<T0 extends React.ElementType, P = unknown> {
  <T extends React.ElementType = T0>(
    props: React.PropsWithChildren<ReplaceProps<T, BsProps<T> & P>>,
    context?: any,
  ): React.ReactElement | null;
  contextTypes?: any;
  defaultProps?: Partial<P>;
  displayName?: string;
}

export class BsComponent<
  T extends React.ElementType,
  P = unknown,
> extends React.Component<ReplaceProps<T, BsProps<T> & P>> {}

export type BsComponentClass<
  As extends React.ElementType,
  P = unknown,
> = React.ComponentClass<ReplaceProps<As, BsProps<As> & P>>;

export type TransitionType = boolean | TransitionComponent;

export function getOverlayDirection(placement: string, isRTL?: boolean) {
  let bsDirection = placement;
  if (placement === 'left') {
    bsDirection = isRTL ? 'end' : 'start';
  } else if (placement === 'right') {
    bsDirection = isRTL ? 'start' : 'end';
  }
  return bsDirection;
}
