import { classNames, BsProps, BsRef, TransitionType } from "./helpers.js"
import { Context, useTabPanel, NoopTransition } from "./base/Tab.jsx"
import { Fade } from "./Fade.jsx"
import { Selectable } from "./base/SelectableContext.jsx"
import { Tabs, Props } from "./base/Tabs.jsx"
import { useBs } from "./Theme.jsx"
import { withBs } from "./utils.jsx"
import * as qr from "react"
import type * as qt from "./base/types.jsx"

export function getTabTransitionComponent(
  x?: TransitionType
): qt.TransitionComponent | undefined {
  if (typeof x === "boolean") {
    return x ? Fade : NoopTransition
  }
  return x
}

export interface ContainerProps extends Omit<Props, "transition"> {
  transition?: TransitionType
}

export const Container = ({ transition, ...props }: ContainerProps) => (
  <Tabs {...props} transition={getTabTransitionComponent(transition)} />
)
Container.displayName = "TabContainer"

export const Content = withBs("tab-content")

export interface PaneProps
  extends qt.TransitionCBs,
    BsProps,
    qr.HTMLAttributes<HTMLElement> {
  eventKey?: qt.EventKey
  active?: boolean
  transition?: TransitionType
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export const Pane: BsRef<"div", PaneProps> = qr.forwardRef<
  HTMLElement,
  PaneProps
>(({ bsPrefix, transition, ...xs }, ref) => {
  const [
    { className, as: X = "div", ...rest },
    {
      isActive,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      mountOnEnter,
      unmountOnExit,
      transition: Transition = Fade,
    },
  ] = useTabPanel({
    ...xs,
    transition: getTabTransitionComponent(transition),
  } as any)
  const bs = useBs(bsPrefix, "tab-pane")
  return (
    <Context.Provider value={null}>
      <Selectable.Provider value={null}>
        <Transition
          in={isActive}
          onEnter={onEnter}
          onEntering={onEntering}
          onEntered={onEntered}
          onExit={onExit}
          onExiting={onExiting}
          onExited={onExited}
          mountOnEnter={mountOnEnter}
          unmountOnExit={unmountOnExit as any}
        >
          <X
            {...rest}
            ref={ref}
            className={classNames(className, bs, isActive && "active")}
          />
        </Transition>
      </Selectable.Provider>
    </Context.Provider>
  )
})
Pane.displayName = "TabPane"

export interface Props extends Omit<PaneProps, "title"> {
  title: qr.ReactNode
  disabled?: boolean
  tabClassName?: string
  tabAttrs?: Record<string, any>
}

export const Tab: qr.FC<Props> = () => {
  throw new Error(
    "ReactBootstrap: The `Tab` component is not meant to be rendered! " +
      "It's an abstract component that is only valid as a direct Child of the `Tabs` Component. " +
      "For custom tabs components use TabPane and TabsContainer directly"
  )
  return <></>
}
