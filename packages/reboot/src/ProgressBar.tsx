import { classNames, BsProps } from "./helpers.js"
import { map } from "./utils.jsx"
import { useBs } from "./Theme.jsx"
import * as qr from "react"

export interface Props extends qr.HTMLAttributes<HTMLDivElement>, BsProps {
  min?: number | undefined
  now?: number | undefined
  max?: number | undefined
  label?: qr.ReactNode
  visuallyHidden?: boolean | undefined
  striped?: boolean | undefined
  animated?: boolean | undefined
  variant?: "success" | "danger" | "warning" | "info" | string | undefined
  isChild?: boolean
}

const ROUND_PRECISION = 1000

function getPercentage(now: number, min: number, max: number) {
  const percentage = ((now - min) / (max - min)) * 100
  return Math.round(percentage * ROUND_PRECISION) / ROUND_PRECISION
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
  ref: any
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
  )
}

export const ProgressBar = qr.forwardRef<HTMLDivElement, Props>(
  ({ isChild, ...ps }: Props, ref) => {
    ps.bsPrefix = useBs(ps.bsPrefix, "progress")
    if (isChild) {
      return renderProgressBar(ps, ref)
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
    } = ps
    return (
      <div
        ref={ref}
        {...wrapperProps}
        className={classNames(className, bsPrefix)}
      >
        {children
          ? map(children, child => qr.cloneElement(child, { isChild: true }))
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
              ref
            )}
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"
ProgressBar.defaultProps = {
  min: 0,
  max: 100,
  animated: false,
  isChild: false,
  visuallyHidden: false,
  striped: false,
}
