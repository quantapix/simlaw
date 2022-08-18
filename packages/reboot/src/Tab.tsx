import * as React from "react"
import SelectableContext from "@restart/ui/esm/SelectableContext.jsx"
import TabContext from "@restart/ui/esm/TabContext.jsx"
import { useTabPanel } from "@restart/ui/esm/TabPanel.jsx"
import type {
  EventKey,
  TransitionCallbacks,
  TransitionComponent,
} from "@restart/ui/esm/types.jsx"
import Tabs, { TabsProps } from "@restart/ui/esm/Tabs.jsx"
import NoopTransition from "@restart/ui/esm/NoopTransition.jsx"
import { useBs } from "./Theme.jsx"
import { Fade } from "./Fade.jsx"
import { classNames, BsProps, BsRef, TransitionType } from "./helpers.js"
import { withBs } from "./utils.jsx"

export function getTabTransitionComponent(
  x?: TransitionType
): TransitionComponent | undefined {
  if (typeof x === "boolean") {
    return x ? Fade : NoopTransition
  }
  return x
}

export interface ContainerProps extends Omit<TabsProps, "transition"> {
  transition?: TransitionType
}

export const Container = ({ transition, ...props }: ContainerProps) => (
  <Tabs {...props} transition={getTabTransitionComponent(transition)} />
)
Container.displayName = "TabContainer"

export const Content = withBs("tab-content")

export interface PaneProps
  extends TransitionCallbacks,
    BsProps,
    React.HTMLAttributes<HTMLElement> {
  eventKey?: EventKey
  active?: boolean
  transition?: TransitionType
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export const Pane: BsRef<"div", PaneProps> = React.forwardRef<
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
    <TabContext.Provider value={null}>
      <SelectableContext.Provider value={null}>
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
      </SelectableContext.Provider>
    </TabContext.Provider>
  )
})
Pane.displayName = "TabPane"

export interface Props extends Omit<PaneProps, "title"> {
  title: React.ReactNode
  disabled?: boolean
  tabClassName?: string
  tabAttrs?: Record<string, any>
}

export const Tab: React.FC<Props> = () => {
  throw new Error(
    "ReactBootstrap: The `Tab` component is not meant to be rendered! " +
      "It's an abstract component that is only valid as a direct Child of the `Tabs` Component. " +
      "For custom tabs components use TabPane and TabsContainer directly"
  )
  return <></>
}
