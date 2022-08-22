import * as qr from "react"
import * as qt from "./types.js"

export function NoopTransition({
  children,
  in: inProp,
  mountOnEnter,
  unmountOnExit,
}: qt.TransitionProps) {
  const hasEnteredRef = qr.useRef(inProp)
  qr.useEffect(() => {
    if (inProp) hasEnteredRef.current = true
  }, [inProp])
  if (inProp) return children
  if (unmountOnExit) {
    return null
  }
  if (!hasEnteredRef.current && mountOnEnter) {
    return null
  }
  return children
}

export interface Data {
  onSelect: qt.SelectCB
  activeKey?: qt.EventKey | undefined
  transition?: qt.TransitionComponent | undefined
  mountOnEnter: boolean
  unmountOnExit: boolean
  getControlledId: (key: qt.EventKey) => any
  getControllerId: (key: qt.EventKey) => any
}

export const Context = qr.createContext<Data | null>(null)

export interface Props
  extends qt.TransitionCBs,
    qr.HTMLAttributes<HTMLElement> {
  as?: qr.ElementType
  eventKey?: qt.EventKey
  active?: boolean
  transition?: qt.TransitionComponent
  mountOnEnter?: boolean
  unmountOnExit?: boolean
}

export interface Meta extends qt.TransitionCBs {
  eventKey?: qt.EventKey | undefined
  isActive?: boolean | undefined
  transition?: qt.TransitionComponent | undefined
  mountOnEnter?: boolean | undefined
  unmountOnExit?: boolean | undefined
}

export function useTabPanel({
  active,
  eventKey,
  mountOnEnter,
  transition,
  unmountOnExit,
  role = "tabpanel",
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited,
  ...ps
}: Props): [any, Meta] {
  const context = qr.useContext(Context)
  if (!context)
    return [
      {
        ...ps,
        role,
      },
      {
        eventKey,
        isActive: active,
        mountOnEnter,
        transition,
        unmountOnExit,
        onEnter,
        onEntering,
        onEntered,
        onExit,
        onExiting,
        onExited,
      },
    ]
  const { activeKey, getControlledId, getControllerId, ...rest } = context
  const key = qt.makeEventKey(eventKey)
  return [
    {
      ...ps,
      role,
      id: getControlledId(eventKey!),
      "aria-labelledby": getControllerId(eventKey!),
    },
    {
      eventKey,
      isActive:
        active == null && key != null
          ? qt.makeEventKey(activeKey) === key
          : active,
      transition: transition || rest.transition,
      mountOnEnter: mountOnEnter != null ? mountOnEnter : rest.mountOnEnter,
      unmountOnExit: unmountOnExit != null ? unmountOnExit : rest.unmountOnExit,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
    },
  ]
}

export const Panel: qt.DynRef<"div", Props> = qr.forwardRef<HTMLElement, Props>(
  ({ as: Component = "div", ...ps }, ref) => {
    const [
      tabPanelProps,
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
        transition: Transition = NoopTransition,
      },
    ] = useTabPanel(ps)
    return (
      <Context.Provider value={null}>
        <qt.Selectable.Provider value={null}>
          <Transition
            in={isActive}
            onEnter={onEnter}
            onEntering={onEntering}
            onEntered={onEntered}
            onExit={onExit}
            onExiting={onExiting}
            onExited={onExited}
            mountOnEnter={mountOnEnter}
            unmountOnExit={unmountOnExit}
          >
            <Component
              {...tabPanelProps}
              ref={ref}
              hidden={!isActive}
              aria-hidden={!isActive}
            />
          </Transition>
        </qt.Selectable.Provider>
      </Context.Provider>
    )
  }
)
Panel.displayName = "TabPanel"
