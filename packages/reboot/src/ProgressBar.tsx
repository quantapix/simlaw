import { BsPrefixProps } from "./utils"
import { cloneElement } from "react"
import { map } from "./ElementChildren"
import { useBootstrapPrefix } from "./ThemeProvider"
import * as React from "react"
import classNames from "classnames"
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement>, BsPrefixProps {
  min?: number
  now?: number
  max?: number
  label?: React.ReactNode
  visuallyHidden?: boolean
  striped?: boolean
  animated?: boolean
  variant?: "success" | "danger" | "warning" | "info" | string
  isChild?: boolean
}
const ROUND_PRECISION = 1000
function onlyProgressBar(props, propName, componentName): Error | null {
  const children = props[propName]
  if (!children) return null
  let error: Error | null = null
  React.Children.forEach(children, child => {
    if (error) return
    const element = <ProgressBar />
    if (child.type === element.type) return
    const childType: any = child.type
    const childIdentifier = React.isValidElement(child)
      ? childType.displayName || childType.name || childType
      : child
    error = new Error(
      `Children of ${componentName} can contain only ProgressBar ` +
        `components. Found ${childIdentifier}.`
    )
  })
  return error
}
const defaultProps = {
  min: 0,
  max: 100,
  animated: false,
  isChild: false,
  visuallyHidden: false,
  striped: false,
}
function getPercentage(now, min, max) {
  const y = ((now - min) / (max - min)) * 100
  return Math.round(y * ROUND_PRECISION) / ROUND_PRECISION
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
  }: ProgressBarProps,
  ref
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
      {visuallyHidden ? <span className="visually-hidden">{label}</span> : label}
    </div>
  )
}
export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ isChild, ...ps }: ProgressBarProps, ref) => {
    ps.bsPrefix = useBootstrapPrefix(ps.bsPrefix, "progress")
    if (isChild) return renderProgressBar(ps, ref)
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
      <div ref={ref} {...wrapperProps} className={classNames(className, bsPrefix)}>
        {children
          ? map(children, child => cloneElement(child, { isChild: true }))
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
ProgressBar.defaultProps = defaultProps
