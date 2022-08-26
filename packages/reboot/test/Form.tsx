import * as React from "react"
import { render } from "@testing-library/react"
import {
  Check,
  Control,
  FloatingLabel,
  Form,
  Group,
  Label,
  Range,
  Select,
  Switch,
  Text,
} from "../src/Form.jsx"
import { shouldWarn } from "./helpers.js"

describe("<Form>", () => {
  it("should support custom `as`", () => {
    const { getByTestId } = render(
      <Form as="fieldset" className="my-form" data-testid="test">
        <Group />
      </Form>
    )
    const form = getByTestId("test")
    expect(form.tagName.toLowerCase()).toEqual("fieldset")
    expect(form.classList.length).toEqual(1)
    expect(form.classList.contains("my-form")).toBe(true)
    expect(form.childElementCount).toEqual(1)
    expect(form.firstElementChild?.classList.length).toEqual(0)
  })
  it("Should have form as default component", () => {
    const { getByTestId } = render(<Form data-testid="test" />)
    const form = getByTestId("test")
    expect(form.tagName.toLowerCase()).toEqual("form")
  })
  it("should have form class `was-validated` if validated", () => {
    const { getByTestId } = render(<Form validated data-testid="test" />)
    const form = getByTestId("test")
    expect(form.classList.length).toEqual(1)
    expect(form.classList.contains("was-validated")).toBe(true)
  })
})

describe("<Check>", () => {
  it("should render correctly", () => {
    const { getByTestId, container } = render(
      <Check
        id="foo"
        name="foo"
        value="foo"
        defaultChecked
        label="My label"
        className="my-checkbox"
        data-testid="test-id"
      />
    )
    const element = getByTestId("test-id")
    expect(element.parentElement!.classList.length).toEqual(2)
    expect(element.parentElement!.classList.contains("form-check")).toBe(true)
    expect(element.parentElement!.classList.contains("my-checkbox")).toBe(true)
    expect(element.id).toEqual("foo")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("form-check-input")).toBe(true)
    expect(element.getAttribute("name")!).toEqual("foo")
    expect(element.getAttribute("type")!).toEqual("checkbox")
    expect(element.getAttribute("value")!).toEqual("foo")
    expect(element.getAttribute("checked")!).toEqual("")
    const labels = container.getElementsByTagName("label")
    expect(labels.length).toEqual(1)
    const label = labels[0]
    expect(label.classList.length).toEqual(1)
    expect(label.classList.contains("form-check-label")).toBe(true)
    expect(label.getAttribute("for")!).toEqual("foo")
    expect(label.innerText).toEqual("My label")
  })
  it("should render radio correctly", () => {
    const { getByTestId, container } = render(
      <Check
        id="foo"
        name="foo"
        value="foo"
        type="radio"
        defaultChecked
        className="my-radio"
        label="My label"
        data-testid="test-id"
      />
    )
    const element = getByTestId("test-id")
    expect(element.parentElement!.classList.length).toEqual(2)
    expect(element.parentElement!.classList.contains("form-check")).toBe(true)
    expect(element.parentElement!.classList.contains("my-radio")).toBe(true)
    expect(element.id).toEqual("foo")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("form-check-input")).toBe(true)
    expect(element.getAttribute("name")!).toEqual("foo")
    expect(element.getAttribute("type")!).toEqual("radio")
    expect(element.getAttribute("value")!).toEqual("foo")
    expect(element.getAttribute("checked")!).toEqual("")
    const labels = container.getElementsByTagName("label")
    expect(labels.length).toEqual(1)
    const label = labels[0]
    expect(label.classList.length).toEqual(1)
    expect(label.classList.contains("form-check-label")).toBe(true)
    expect(label.getAttribute("for")!).toEqual("foo")
    expect(label.innerText).toEqual("My label")
  })
  it("should support inline", () => {
    const {
      container: { firstElementChild: element },
    } = render(<Check inline label="My label" />)
    expect(element!.classList.length).toEqual(2)
    expect(element!.classList.contains("form-check-inline")).toBe(true)
  })
  it("should support in reverse", () => {
    const {
      container: { firstElementChild: element },
    } = render(<Check reverse label="My label" />)
    expect(element!.classList.length).toEqual(2)
    expect(element!.classList.contains("form-check-reverse")).toBe(true)
  })
  it("should support isValid", () => {
    const { getByTestId } = render(<Check isValid data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("is-valid")).toBe(true)
  })
  it("should support isInvalid", () => {
    const { getByTestId } = render(<Check isInvalid data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("is-invalid")).toBe(true)
  })
  it("should support ref forwarding", () => {
    let input
    class Container extends React.Component {
      render() {
        return (
          <Check
            ref={ref => {
              input = ref
            }}
          />
        )
      }
    }
    render(<Container />)
    expect(input.tagName.toLowerCase()).toEqual("input")
  })
  it("should not render bsPrefix if no label is specified", () => {
    const { container } = render(
      <Check id="foo" name="foo" value="foo" type="radio" />
    )
    expect(container.getElementsByClassName("form-check").length).toEqual(0)
  })
  it("should support type switch", () => {
    const { getByTestId, container } = render(
      <Check
        type="switch"
        label="My label"
        id="switch-id"
        data-testid="test-id"
      />
    )
    const element = getByTestId("test-id")
    expect(element.parentElement!.classList.length).toEqual(2)
    expect(element.parentElement!.classList.contains("form-check")).toBe(true)
    expect(element.parentElement!.classList.contains("form-switch")).toBe(true)
    expect(element.id).toEqual("switch-id")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("form-check-input")).toBe(true)
    expect(element.id).toEqual("switch-id")
    expect(element.getAttribute("type")!).toEqual("checkbox")
    const labels = container.getElementsByTagName("label")
    expect(labels.length).toEqual(1)
    const label = labels[0]
    expect(label.classList.length).toEqual(1)
    expect(label.classList.contains("form-check-label")).toBe(true)
    expect(label.getAttribute("for")!).toEqual("switch-id")
    expect(label.innerText).toEqual("My label")
  })
  it("should support Switch", () => {
    const { getByTestId, container } = render(
      <Switch label="My label" id="switch-id" data-testid="test-id" />
    )
    const element = getByTestId("test-id")
    expect(element.parentElement!.classList.length).toEqual(2)
    expect(element.parentElement!.classList.contains("form-check")).toBe(true)
    expect(element.parentElement!.classList.contains("form-switch")).toBe(true)
    expect(element.id).toEqual("switch-id")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("form-check-input")).toBe(true)
    expect(element.id).toEqual("switch-id")
    expect(element.getAttribute("type")!).toEqual("checkbox")
    const labels = container.getElementsByTagName("label")
    expect(labels.length).toEqual(1)
    const label = labels[0]
    expect(label.classList.length).toEqual(1)
    expect(label.classList.contains("form-check-label")).toBe(true)
    expect(label.getAttribute("for")!).toEqual("switch-id")
    expect(label.innerText).toEqual("My label")
  })
  it('should support "as"', () => {
    const Surrogate = ({ className = "", ...rest }) => (
      <input className={`extraClass ${className}'`} {...rest} />
    )
    const { getByTestId } = render(
      <Check as={Surrogate} data-testid="test-id" />
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("extraClass")).toBe(true)
  })
  it("Should render valid feedback properly", () => {
    const { container } = render(
      <Check label="My label" feedbackType="valid" feedback="test" />
    )
    const feedbacks = container.getElementsByClassName("valid-feedback")
    expect(feedbacks.length).toEqual(1)
    expect(feedbacks[0].textContent!).toEqual("test")
  })
  it("Should render invalid feedback properly", () => {
    const { container } = render(
      <Check label="My label" feedbackType="invalid" feedback="test" />
    )
    const feedbacks = container.getElementsByClassName("invalid-feedback")
    expect(feedbacks.length).toEqual(1)
    expect(feedbacks[0].textContent!).toEqual("test")
  })
  it("Should render valid feedback tooltip properly", () => {
    const { container } = render(
      <Check
        label="My label"
        feedbackType="valid"
        feedback="test"
        feedbackTooltip
      />
    )
    const feedbacks = container.getElementsByClassName("valid-tooltip")
    expect(feedbacks.length).toEqual(1)
    expect(feedbacks[0].textContent!).toEqual("test")
  })
  it("Should render invalid feedback tooltip properly", () => {
    const { container } = render(
      <Check
        label="My label"
        feedbackType="invalid"
        feedback="test"
        feedbackTooltip
      />
    )
    const feedbacks = container.getElementsByClassName("invalid-tooltip")
    expect(feedbacks.length).toEqual(1)
    expect(feedbacks[0].textContent!).toEqual("test")
  })
})

describe("<Control>", () => {
  it("should render correctly", () => {
    const { getByTestId } = render(
      <Control
        type="text"
        id="foo"
        name="bar"
        className="my-control"
        data-testid="test-id"
      />
    )
    const element = getByTestId("test-id")
    expect(element.tagName.toLowerCase()).toEqual("input")
    expect(element.id).toEqual("foo")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("form-control")).toBe(true)
    expect(element.classList.contains("my-control")).toBe(true)
    expect(element.getAttribute("name")!).toEqual("bar")
    expect(element.getAttribute("type")!).toEqual("text")
  })
  it("should support textarea", () => {
    const { getByTestId } = render(
      <Control as="textarea" data-testid="test-id" />
    )
    expect(getByTestId("test-id").tagName.toLowerCase()).toEqual("textarea")
  })
  it("should support plaintext inputs", () => {
    const { getByTestId } = render(<Control plaintext data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(1)
    expect(element.classList.contains("form-control-plaintext")).toBe(true)
  })
  it("should support type=color", () => {
    const { getByTestId } = render(
      <Control type="color" data-testid="test-id" />
    )
    expect(getByTestId("test-id").getAttribute("type")!).toEqual("color")
  })
  it("should use controlId for id", () => {
    const { getByTestId } = render(
      <Group controlId="foo">
        <Control type="text" data-testid="test-id" />
      </Group>
    )
    expect(getByTestId("test-id").id).toEqual("foo")
  })
  it("should prefer explicit id", () => {
    shouldWarn("ignored")
    const { getByTestId } = render(
      <Group controlId="foo">
        <Control type="text" id="bar" data-testid="test-id" />
      </Group>
    )
    expect(getByTestId("test-id").id).toEqual("bar")
  })
  it("should support ref forwarding", () => {
    let input
    class Container extends React.Component {
      render() {
        return (
          <Group controlId="foo">
            <Control
              type="text"
              ref={ref => {
                input = ref
              }}
            />
          </Group>
        )
      }
    }
    render(<Container />)
    expect(input.tagName.toLowerCase()).to.toEqual("input")
  })
  it("should properly display size of Control", () => {
    const { getByTestId } = render(
      <Control type="text" size="lg" data-testid="test-id" />
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("form-control-lg")).toBe(true)
  })
  it("should properly display html size of Control", () => {
    const { getByTestId } = render(
      <Control type="text" htmlSize={42} data-testid="test-id" />
    )
    expect(getByTestId("test-id").getAttribute("size")!).toEqual("42")
  })
  it("Should have input as default component", () => {
    const { getByTestId } = render(<Control data-testid="test-id" />)
    expect(getByTestId("test-id").tagName.toLowerCase()).toEqual("input")
  })
  it("should support numbers as values", () => {
    const { getByTestId } = render(
      <Control value={10} onChange={() => undefined} data-testid="test-id" />
    )
    expect(getByTestId("test-id").getAttribute("value")!).toEqual("10")
  })
  it("should support an array of strings as values", () => {
    const { getByTestId } = render(
      <Control
        value={["hello", "world"]}
        onChange={() => undefined}
        data-testid="test-id"
      />
    )
    expect(getByTestId("test-id").getAttribute("value")!).toEqual("hello,world")
  })
})

describe("<Group>", () => {
  it("renders children", () => {
    const { getByTestId } = render(
      <Group data-testid="test-id">
        <span className="child1" />
        <span className="child2" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.childElementCount).toEqual(2)
    const child1 = element.children[0]
    expect(child1.tagName.toLowerCase()).toEqual("span")
    expect(child1.classList.length).toEqual(1)
    expect(child1.classList.contains("child1")).toBe(true)
    const child2 = element.children[1]
    expect(child2.tagName.toLowerCase()).toEqual("span")
    expect(child2.classList.length).toEqual(1)
    expect(child2.classList.contains("child2")).toBe(true)
  })
  it("provided controlId to label and control", () => {
    const { getByTestId } = render(
      <Group controlId="my-control" data-testid="test-id">
        <div>
          <Label>label</Label>
          <Control />
        </div>
      </Group>
    )
    const element = getByTestId("test-id")
    const label = element.getElementsByTagName("label")
    expect(label.length).toEqual(1)
    expect(label[0].getAttribute("for")!).toEqual("my-control")
    const input = element.getElementsByTagName("input")
    expect(input.length).toEqual(1)
    expect(input[0].id).to.be.equal("my-control")
  })
  it("Should have div as default component", () => {
    const { getByTestId } = render(<Group data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.tagName.toLowerCase()).toEqual("div")
  })
})

describe("<Label>", () => {
  it("should render correctly", () => {
    const { getByTestId } = render(
      <Label
        id="foo"
        htmlFor="bar"
        className="my-control"
        data-testid="test-id"
      />
    )
    const element = getByTestId("test-id")
    expect(element.tagName.toLowerCase()).toEqual("label")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("form-label")).toBe(true)
    expect(element.classList.contains("my-control")).toBe(true)
    expect(element.id).toEqual("foo")
    expect(element.getAttribute("for")!).to.not.null
  })
  it("should use controlId for htmlFor", () => {
    const { getByTestId } = render(
      <Group controlId="foo">
        <Label data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.getAttribute("for")!).toEqual("foo")
  })
  it("should render as a Col", () => {
    const { getByTestId } = render(
      <Label column sm={4} data-testid="test-id">
        Label
      </Label>
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(3)
    expect(element.classList.contains("form-label")).toBe(true)
    expect(element.classList.contains("col-form-label")).toBe(true)
    expect(element.classList.contains("col-sm-4")).toBe(true)
  })
  it("should use controlId for htmlFor when render as Col", () => {
    const { getByTestId } = render(
      <Group controlId="foo">
        <Label column sm={4} data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(3)
    expect(element.classList.contains("form-label")).toBe(true)
    expect(element.classList.contains("col-form-label")).toBe(true)
    expect(element.classList.contains("col-sm-4")).toBe(true)
    expect(element.getAttribute("for")!).toEqual("foo")
  })
  it("should respect visuallyHidden", () => {
    const { getByTestId } = render(
      <Label visuallyHidden data-testid="test-id">
        Label
      </Label>
    )
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("visually-hidden")).toBe(true)
  })
  it("should prefer explicit htmlFor", () => {
    shouldWarn("ignored")
    const { getByTestId } = render(
      <Group controlId="foo">
        <Label htmlFor="bar" data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.getAttribute("for")!).toEqual("bar")
  })
  it("should support ref forwarding", () => {
    let input
    class Container extends React.Component {
      render() {
        return (
          <Group controlId="foo">
            <Label
              ref={ref => {
                input = ref
              }}
            />
          </Group>
        )
      }
    }
    render(<Container />)
    expect(input.tagName.toLowerCase()).to.toEqual("label")
  })
  it("should support ref forwarding when rendered as a Col", () => {
    let input
    class Container extends React.Component {
      render() {
        return (
          <Group controlId="foo">
            <Label
              column
              ref={ref => {
                input = ref
              }}
            />
          </Group>
        )
      }
    }
    render(<Container />)
    expect(input.tagName.toLowerCase()).to.toEqual("label")
  })
  it("accepts as prop", () => {
    const { getByTestId } = render(
      <Label as="legend" data-testid="test-id">
        body
      </Label>
    )
    expect(getByTestId("test-id").tagName.toLowerCase()).toEqual("legend")
  })
  it("should properly size itself when rendered as a Col", () => {
    const { getByTestId } = render(
      <div>
        <Label column="sm" data-testid="test-1">
          Label
        </Label>
        <Label column data-testid="test-2">
          Label
        </Label>
        <Label column="lg" data-testid="test-3">
          Label
        </Label>
      </div>
    )
    expect(getByTestId("test-1").classList.contains("col-form-label-sm")).to.be
      .true
    expect(getByTestId("test-2").classList.contains("col-form-label")).to.be
      .true
    expect(getByTestId("test-3").classList.contains("col-form-label-lg")).to.be
      .true
  })
})

describe("<Range>", () => {
  it("should render correctly", () => {
    const { getByTestId } = render(
      <Range id="foo" name="bar" className="my-control" data-testid="test-id" />
    )
    const element = getByTestId("test-id")
    expect(element.tagName.toLowerCase()).toEqual("input")
    expect(element.id).toEqual("foo")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("form-range")).toBe(true)
    expect(element.classList.contains("my-control")).toBe(true)
    expect(element.getAttribute("name")!).toEqual("bar")
    expect(element.getAttribute("type")!).toEqual("range")
  })
  it("should render controlId as id correctly", () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Range data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.id).toEqual("controll-id")
  })
  it("should override controlId correctly", () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Range id="overridden-id" data-testid="test-id" />
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.id).toEqual("overridden-id")
  })
})

describe("<Select>", () => {
  it("should render correctly", () => {
    const { getByTestId } = render(
      <Select data-testid="test-id" name="bar" className="my-control" />
    )
    const element = getByTestId("test-id")
    expect(element.tagName.toLowerCase()).toEqual("select")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("my-control")).toBe(true)
    expect(element.classList.contains("form-select")).toBe(true)
    expect(element.getAttribute("name")!).toEqual("bar")
  })
  it("should render size correctly", () => {
    const { getByTestId } = render(<Select size="lg" data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("form-select-lg")).toBe(true)
  })
  it("should render htmlSize correctly", () => {
    const { getByTestId } = render(
      <Select htmlSize={3} data-testid="test-id" />
    )
    const element = getByTestId("test-id")
    expect(element.getAttribute("size")!).toEqual("3")
  })
  it("should render isValid correctly", () => {
    const { getByTestId } = render(<Select isValid data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("is-valid")).toBe(true)
  })
  it("should render isInvalid correctly", () => {
    const { getByTestId } = render(<Select isInvalid data-testid="test-id" />)
    const element = getByTestId("test-id")
    expect(element.classList.length).toEqual(2)
    expect(element.classList.contains("is-invalid")).toBe(true)
  })
  it("should render controlId correctly", () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Select data-testid="test-id">
          <option>1</option>
        </Select>
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.id).toEqual("controll-id")
  })
  it("should override controlId correctly", () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Select id="overridden-id" data-testid="test-id">
          <option>1</option>
        </Select>
      </Group>
    )
    const element = getByTestId("test-id")
    expect(element.id).toEqual("overridden-id")
  })
})

describe("<FloatingLabel>", () => {
  it("should render correctly", () => {
    const { getByText, getByRole, getByTestId } = render(
      <FloatingLabel label="MyLabel" data-testid="test">
        <Control type="text" />
      </FloatingLabel>
    )
    expect(getByTestId("test").classList.contains("form-floating")).toBe(true)
    expect(getByText("MyLabel")).toBeTruthy()
    expect(getByRole("textbox")).toBeTruthy()
  })
  it("should pass controlId to input and label", () => {
    const { getByRole, getByText } = render(
      <FloatingLabel label="MyLabel" controlId="MyId">
        <Control type="text" />
      </FloatingLabel>
    )
    expect(getByRole("textbox").getAttribute("id")).toEqual("MyId")
    expect(getByText("MyLabel").getAttribute("for")).toEqual("MyId")
  })
  it('should support "as"', () => {
    const { getByTestId } = render(
      <FloatingLabel label="MyLabel" as="span" data-testid="test">
        <Control type="text" />
      </FloatingLabel>
    )
    const label = getByTestId("test")
    expect(label.tagName.toLowerCase()).to.be.equal("span")
    expect(label.classList.contains("form-floating")).toBe(true)
  })
})

describe("<Text>", () => {
  it("should render correctly", () => {
    const { getByTestId } = render(
      <Text data-testid="foo" className="my-form-text">
        Help content
      </Text>
    )
    const text = getByTestId("foo")
    expect(text.classList.length).toEqual(2)
    expect(text.classList.contains("form-text")).toBe(true)
    expect(text.classList.contains("my-form-text")).toBe(true)
    expect(text.innerText).toEqual("Help content")
  })
  it("Should have small as default component", () => {
    const { getByTestId } = render(<Text data-testid="foo" />)
    const text = getByTestId("foo")
    expect(text.tagName.toLowerCase()).toEqual("small")
  })
  it('Should have "form-text" & "text-muted" class', () => {
    const { getByTestId } = render(<Text data-testid="foo" muted />)
    const text = getByTestId("foo")
    expect(text.classList.length).toEqual(2)
    expect(text.classList.contains("form-text")).toBe(true)
    expect(text.classList.contains("text-muted")).toBe(true)
  })
})
