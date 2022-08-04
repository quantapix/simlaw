import classNames from 'classnames';
import * as React from 'react';
import { cloneElement } from 'react';
import { useBs } from './Theme';
import { map } from './utils';
import { BsProps } from './helpers';

export interface Props extends React.HTMLAttributes<HTMLDivElement>, BsProps {
  min?: number;
  now?: number;
  max?: number;
  label?: React.ReactNode;
  visuallyHidden?: boolean;
  striped?: boolean;
  animated?: boolean;
  variant?: 'success' | 'danger' | 'warning' | 'info' | string;
  isChild?: boolean;
}

const ROUND_PRECISION = 1000;

function getPercentage(now, min, max) {
  const percentage = ((now - min) / (max - min)) * 100;
  return Math.round(percentage * ROUND_PRECISION) / ROUND_PRECISION;
}

function renderProgressBar(
  {
    min,
    now,
    max,
    label,
    visuallyHidden,
    striped,
    animated,
    className,
    style,
    variant,
    bsPrefix,
    ...ps
  }: Props,
  ref,
) {
  return (
    <div
      ref={ref}
      {...ps}
      role="progressbar"
      className={classNames(className, `${bsPrefix}-bar`, {
        [`bg-${variant}`]: variant,
        [`${bsPrefix}-bar-animated`]: animated,
        [`${bsPrefix}-bar-striped`]: animated || striped,
      })}
      style={{ width: `${getPercentage(now, min, max)}%`, ...style }}
      aria-valuenow={now}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {visuallyHidden ? (
        <span className="visually-hidden">{label}</span>
      ) : (
        label
      )}
    </div>
  );
}

export const ProgressBar = React.forwardRef<HTMLDivElement, Props>(
  ({ isChild, ...ps }: Props, ref) => {
    ps.bsPrefix = useBs(ps.bsPrefix, 'progress');
    if (isChild) {
      return renderProgressBar(ps, ref);
    }
    const {
      min,
      now,
      max,
      label,
      visuallyHidden,
      striped,
      animated,
      bsPrefix,
      variant,
      className,
      children,
      ...wrapperProps
    } = ps;
    return (
      <div
        ref={ref}
        {...wrapperProps}
        className={classNames(className, bsPrefix)}
      >
        {children
          ? map(children, (child) => cloneElement(child, { isChild: true }))
          : renderProgressBar(
              {
                min,
                now,
                max,
                label,
                visuallyHidden,
                striped,
                animated,
                bsPrefix,
                variant,
              },
              ref,
            )}
      </div>
    );
  },
);
ProgressBar.displayName = 'ProgressBar';
ProgressBar.defaultProps = {
  min: 0,
  max: 100,
  animated: false,
  isChild: false,
  visuallyHidden: false,
  striped: false,
};
