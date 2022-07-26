import { Context, useTabPanel, NoopTransition } from "./base/Tab.js"
import { Fade } from "./Fade.js"
import { Tabs, Props as TabsProps } from "./base/Tabs.js"
import { useBs } from "./Theme.js"
import { withBs } from "./utils.js"
import * as qr from "react"
import * as qt from "./types.js"

export function getTabTransition(
  x?: qt.Transition2
): qt.Transition | undefined {
  if (typeof x === "boolean") {
    return x ? Fade : NoopTransition
  }
  return x
}

export interface ContainerProps extends Omit<TabsProps, "transition"> {
  transition?: qt.Transition2
}

export const Container = ({ transition, ...ps }: ContainerProps) => (
  <Tabs {...ps} transition={getTabTransition(transition)} />
)
Container.displayName = "TabContainer"

export const Content = withBs("tab-content")

export interface PaneProps
  extends qt.TransitionCBs,
    qt.BsProps,
    qr.HTMLAttributes<HTMLElement> {
  eventKey?: qt.EventKey
  active?: boolean
  transition?: qt.Transition2
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export const Pane: qt.BsRef<"div", PaneProps> = qr.forwardRef<
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
      transition: Y = Fade,
    },
  ] = useTabPanel({
    ...xs,
    transition: getTabTransition(transition),
  } as any)
  const bs = useBs(bsPrefix, "tab-pane")
  return (
    <Context.Provider value={null}>
      <qt.Selectable.Provider value={null}>
        <Y
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
            className={qt.classNames(className, bs, isActive && "active")}
          />
        </Y>
      </qt.Selectable.Provider>
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
}
