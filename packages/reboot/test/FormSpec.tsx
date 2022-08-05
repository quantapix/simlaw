import * as React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'chai';
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
} from '../src/Form';
import { shouldWarn } from './helpers';

describe('<Form>', () => {
  it('should support custom `as`', () => {
    const { getByTestId } = render(
      <Form as="fieldset" className="my-form" data-testid="test">
        <Group />
      </Form>,
    );
    const form = getByTestId('test');
    form.tagName.toLowerCase().should.equal('fieldset');
    form.classList.length.should.equal(1);
    form.classList.contains('my-form').should.be.true;
    form.childElementCount.should.equal(1);
    form.firstElementChild?.classList.length.should.equal(0);
  });
  it('Should have form as default component', () => {
    const { getByTestId } = render(<Form data-testid="test" />);
    const form = getByTestId('test');
    form.tagName.toLowerCase().should.equal('form');
  });
  it('should have form class `was-validated` if validated', () => {
    const { getByTestId } = render(<Form validated data-testid="test" />);
    const form = getByTestId('test');
    form.classList.length.should.equal(1);
    form.classList.contains('was-validated').should.be.true;
  });
});

describe('<Check>', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <Check
        id="foo"
        name="foo"
        value="foo"
        defaultChecked
        label="My label"
        className="my-checkbox"
        data-testid="test-id"
      />,
    );
    const element = getByTestId('test-id');
    element.parentElement!.classList.length.should.equal(2);
    element.parentElement!.classList.contains('form-check').should.be.true;
    element.parentElement!.classList.contains('my-checkbox').should.be.true;
    element.id.should.equal('foo');
    element.classList.length.should.equal(1);
    element.classList.contains('form-check-input').should.be.true;
    element.getAttribute('name')!.should.equal('foo');
    element.getAttribute('type')!.should.equal('checkbox');
    element.getAttribute('value')!.should.equal('foo');
    element.getAttribute('checked')!.should.equal('');
    const labels = container.getElementsByTagName('label');
    labels.length.should.equal(1);
    const label = labels[0];
    label.classList.length.should.equal(1);
    label.classList.contains('form-check-label').should.be.true;
    label.getAttribute('for')!.should.equal('foo');
    label.innerText.should.equal('My label');
  });
  it('should render radio correctly', () => {
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
      />,
    );
    const element = getByTestId('test-id');
    element.parentElement!.classList.length.should.equal(2);
    element.parentElement!.classList.contains('form-check').should.be.true;
    element.parentElement!.classList.contains('my-radio').should.be.true;
    element.id.should.equal('foo');
    element.classList.length.should.equal(1);
    element.classList.contains('form-check-input').should.be.true;
    element.getAttribute('name')!.should.equal('foo');
    element.getAttribute('type')!.should.equal('radio');
    element.getAttribute('value')!.should.equal('foo');
    element.getAttribute('checked')!.should.equal('');
    const labels = container.getElementsByTagName('label');
    labels.length.should.equal(1);
    const label = labels[0];
    label.classList.length.should.equal(1);
    label.classList.contains('form-check-label').should.be.true;
    label.getAttribute('for')!.should.equal('foo');
    label.innerText.should.equal('My label');
  });
  it('should support inline', () => {
    const {
      container: { firstElementChild: element },
    } = render(<Check inline label="My label" />);
    element!.classList.length.should.equal(2);
    element!.classList.contains('form-check-inline').should.be.true;
  });
  it('should support in reverse', () => {
    const {
      container: { firstElementChild: element },
    } = render(<Check reverse label="My label" />);
    element!.classList.length.should.equal(2);
    element!.classList.contains('form-check-reverse').should.be.true;
  });
  it('should support isValid', () => {
    const { getByTestId } = render(<Check isValid data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('is-valid').should.be.true;
  });
  it('should support isInvalid', () => {
    const { getByTestId } = render(<Check isInvalid data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('is-invalid').should.be.true;
  });
  it('should support ref forwarding', () => {
    let input;
    class Container extends React.Component {
      render() {
        return (
          <Check
            ref={(ref) => {
              input = ref;
            }}
          />
        );
      }
    }
    render(<Container />);
    input.tagName.toLowerCase().should.equal('input');
  });
  it('should not render bsPrefix if no label is specified', () => {
    const { container } = render(
      <Check id="foo" name="foo" value="foo" type="radio" />,
    );
    container.getElementsByClassName('form-check').length.should.equal(0);
  });
  it('should support type switch', () => {
    const { getByTestId, container } = render(
      <Check
        type="switch"
        label="My label"
        id="switch-id"
        data-testid="test-id"
      />,
    );
    const element = getByTestId('test-id');
    element.parentElement!.classList.length.should.equal(2);
    element.parentElement!.classList.contains('form-check').should.be.true;
    element.parentElement!.classList.contains('form-switch').should.be.true;
    element.id.should.equal('switch-id');
    element.classList.length.should.equal(1);
    element.classList.contains('form-check-input').should.be.true;
    element.id.should.equal('switch-id');
    element.getAttribute('type')!.should.equal('checkbox');
    const labels = container.getElementsByTagName('label');
    labels.length.should.equal(1);
    const label = labels[0];
    label.classList.length.should.equal(1);
    label.classList.contains('form-check-label').should.be.true;
    label.getAttribute('for')!.should.equal('switch-id');
    label.innerText.should.equal('My label');
  });
  it('should support Switch', () => {
    const { getByTestId, container } = render(
      <Switch label="My label" id="switch-id" data-testid="test-id" />,
    );
    const element = getByTestId('test-id');
    element.parentElement!.classList.length.should.equal(2);
    element.parentElement!.classList.contains('form-check').should.be.true;
    element.parentElement!.classList.contains('form-switch').should.be.true;
    element.id.should.equal('switch-id');
    element.classList.length.should.equal(1);
    element.classList.contains('form-check-input').should.be.true;
    element.id.should.equal('switch-id');
    element.getAttribute('type')!.should.equal('checkbox');
    const labels = container.getElementsByTagName('label');
    labels.length.should.equal(1);
    const label = labels[0];
    label.classList.length.should.equal(1);
    label.classList.contains('form-check-label').should.be.true;
    label.getAttribute('for')!.should.equal('switch-id');
    label.innerText.should.equal('My label');
  });
  it('should support "as"', () => {
    const Surrogate = ({ className = '', ...rest }) => (
      <input className={`extraClass ${className}'`} {...rest} />
    );
    const { getByTestId } = render(
      <Check as={Surrogate} data-testid="test-id" />,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('extraClass').should.be.true;
  });
  it('Should render valid feedback properly', () => {
    const { container } = render(
      <Check label="My label" feedbackType="valid" feedback="test" />,
    );
    const feedbacks = container.getElementsByClassName('valid-feedback');
    feedbacks.length.should.equal(1);
    feedbacks[0].textContent!.should.equal('test');
  });
  it('Should render invalid feedback properly', () => {
    const { container } = render(
      <Check label="My label" feedbackType="invalid" feedback="test" />,
    );
    const feedbacks = container.getElementsByClassName('invalid-feedback');
    feedbacks.length.should.equal(1);
    feedbacks[0].textContent!.should.equal('test');
  });
  it('Should render valid feedback tooltip properly', () => {
    const { container } = render(
      <Check
        label="My label"
        feedbackType="valid"
        feedback="test"
        feedbackTooltip
      />,
    );
    const feedbacks = container.getElementsByClassName('valid-tooltip');
    feedbacks.length.should.equal(1);
    feedbacks[0].textContent!.should.equal('test');
  });
  it('Should render invalid feedback tooltip properly', () => {
    const { container } = render(
      <Check
        label="My label"
        feedbackType="invalid"
        feedback="test"
        feedbackTooltip
      />,
    );
    const feedbacks = container.getElementsByClassName('invalid-tooltip');
    feedbacks.length.should.equal(1);
    feedbacks[0].textContent!.should.equal('test');
  });
});

describe('<Control>', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <Control
        type="text"
        id="foo"
        name="bar"
        className="my-control"
        data-testid="test-id"
      />,
    );
    const element = getByTestId('test-id');
    element.tagName.toLowerCase().should.equal('input');
    element.id.should.equal('foo');
    element.classList.length.should.equal(2);
    element.classList.contains('form-control').should.be.true;
    element.classList.contains('my-control').should.be.true;
    element.getAttribute('name')!.should.equal('bar');
    element.getAttribute('type')!.should.equal('text');
  });
  it('should support textarea', () => {
    const { getByTestId } = render(
      <Control as="textarea" data-testid="test-id" />,
    );
    getByTestId('test-id').tagName.toLowerCase().should.equal('textarea');
  });
  it('should support plaintext inputs', () => {
    const { getByTestId } = render(<Control plaintext data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.classList.length.should.equal(1);
    element.classList.contains('form-control-plaintext').should.be.true;
  });
  it('should support type=color', () => {
    const { getByTestId } = render(
      <Control type="color" data-testid="test-id" />,
    );
    getByTestId('test-id').getAttribute('type')!.should.equal('color');
  });
  it('should use controlId for id', () => {
    const { getByTestId } = render(
      <Group controlId="foo">
        <Control type="text" data-testid="test-id" />
      </Group>,
    );
    getByTestId('test-id').id.should.equal('foo');
  });
  it('should prefer explicit id', () => {
    shouldWarn('ignored');
    const { getByTestId } = render(
      <Group controlId="foo">
        <Control type="text" id="bar" data-testid="test-id" />
      </Group>,
    );
    getByTestId('test-id').id.should.equal('bar');
  });
  it('should support ref forwarding', () => {
    let input;
    class Container extends React.Component {
      render() {
        return (
          <Group controlId="foo">
            <Control
              type="text"
              ref={(ref) => {
                input = ref;
              }}
            />
          </Group>
        );
      }
    }
    render(<Container />);
    input.tagName.toLowerCase().should.to.equal('input');
  });
  it('should properly display size of Control', () => {
    const { getByTestId } = render(
      <Control type="text" size="lg" data-testid="test-id" />,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('form-control-lg').should.be.true;
  });
  it('should properly display html size of Control', () => {
    const { getByTestId } = render(
      <Control type="text" htmlSize={42} data-testid="test-id" />,
    );
    getByTestId('test-id').getAttribute('size')!.should.equal('42');
  });
  it('Should have input as default component', () => {
    const { getByTestId } = render(<Control data-testid="test-id" />);
    getByTestId('test-id').tagName.toLowerCase().should.equal('input');
  });
  it('should support numbers as values', () => {
    const { getByTestId } = render(
      <Control value={10} onChange={() => undefined} data-testid="test-id" />,
    );
    getByTestId('test-id').getAttribute('value')!.should.equal('10');
  });
  it('should support an array of strings as values', () => {
    const { getByTestId } = render(
      <Control
        value={['hello', 'world']}
        onChange={() => undefined}
        data-testid="test-id"
      />,
    );
    getByTestId('test-id').getAttribute('value')!.should.equal('hello,world');
  });
});

describe('<Group>', () => {
  it('renders children', () => {
    const { getByTestId } = render(
      <Group data-testid="test-id">
        <span className="child1" />
        <span className="child2" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.childElementCount.should.equal(2);
    const child1 = element.children[0];
    child1.tagName.toLowerCase().should.equal('span');
    child1.classList.length.should.equal(1);
    child1.classList.contains('child1').should.be.true;
    const child2 = element.children[1];
    child2.tagName.toLowerCase().should.equal('span');
    child2.classList.length.should.equal(1);
    child2.classList.contains('child2').should.be.true;
  });
  it('provided controlId to label and control', () => {
    const { getByTestId } = render(
      <Group controlId="my-control" data-testid="test-id">
        <div>
          <Label>label</Label>
          <Control />
        </div>
      </Group>,
    );
    const element = getByTestId('test-id');
    const label = element.getElementsByTagName('label');
    label.length.should.equal(1);
    label[0].getAttribute('for')!.should.equal('my-control');
    const input = element.getElementsByTagName('input');
    input.length.should.equal(1);
    input[0].id.should.be.equal('my-control');
  });
  it('Should have div as default component', () => {
    const { getByTestId } = render(<Group data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.tagName.toLowerCase().should.equal('div');
  });
});

describe('<Label>', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <Label
        id="foo"
        htmlFor="bar"
        className="my-control"
        data-testid="test-id"
      />,
    );
    const element = getByTestId('test-id');
    element.tagName.toLowerCase().should.equal('label');
    element.classList.length.should.equal(2);
    element.classList.contains('form-label').should.be.true;
    element.classList.contains('my-control').should.be.true;
    element.id.should.equal('foo');
    element.getAttribute('for')!.should.not.null;
  });
  it('should use controlId for htmlFor', () => {
    const { getByTestId } = render(
      <Group controlId="foo">
        <Label data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.getAttribute('for')!.should.equal('foo');
  });
  it('should render as a Col', () => {
    const { getByTestId } = render(
      <Label column sm={4} data-testid="test-id">
        Label
      </Label>,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(3);
    element.classList.contains('form-label').should.be.true;
    element.classList.contains('col-form-label').should.be.true;
    element.classList.contains('col-sm-4').should.be.true;
  });
  it('should use controlId for htmlFor when render as Col', () => {
    const { getByTestId } = render(
      <Group controlId="foo">
        <Label column sm={4} data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(3);
    element.classList.contains('form-label').should.be.true;
    element.classList.contains('col-form-label').should.be.true;
    element.classList.contains('col-sm-4').should.be.true;
    element.getAttribute('for')!.should.equal('foo');
  });
  it('should respect visuallyHidden', () => {
    const { getByTestId } = render(
      <Label visuallyHidden data-testid="test-id">
        Label
      </Label>,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('visually-hidden').should.be.true;
  });
  it('should prefer explicit htmlFor', () => {
    shouldWarn('ignored');
    const { getByTestId } = render(
      <Group controlId="foo">
        <Label htmlFor="bar" data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.getAttribute('for')!.should.equal('bar');
  });
  it('should support ref forwarding', () => {
    let input;
    class Container extends React.Component {
      render() {
        return (
          <Group controlId="foo">
            <Label
              ref={(ref) => {
                input = ref;
              }}
            />
          </Group>
        );
      }
    }
    render(<Container />);
    input.tagName.toLowerCase().should.to.equal('label');
  });
  it('should support ref forwarding when rendered as a Col', () => {
    let input;
    class Container extends React.Component {
      render() {
        return (
          <Group controlId="foo">
            <Label
              column
              ref={(ref) => {
                input = ref;
              }}
            />
          </Group>
        );
      }
    }
    render(<Container />);
    input.tagName.toLowerCase().should.to.equal('label');
  });
  it('accepts as prop', () => {
    const { getByTestId } = render(
      <Label as="legend" data-testid="test-id">
        body
      </Label>,
    );
    getByTestId('test-id').tagName.toLowerCase().should.equal('legend');
  });
  it('should properly size itself when rendered as a Col', () => {
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
      </div>,
    );
    getByTestId('test-1').classList.contains('col-form-label-sm').should.be
      .true;
    getByTestId('test-2').classList.contains('col-form-label').should.be.true;
    getByTestId('test-3').classList.contains('col-form-label-lg').should.be
      .true;
  });
});

describe('<Range>', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <Range
        id="foo"
        name="bar"
        className="my-control"
        data-testid="test-id"
      />,
    );
    const element = getByTestId('test-id');
    element.tagName.toLowerCase().should.equal('input');
    element.id.should.equal('foo');
    element.classList.length.should.equal(2);
    element.classList.contains('form-range').should.be.true;
    element.classList.contains('my-control').should.be.true;
    element.getAttribute('name')!.should.equal('bar');
    element.getAttribute('type')!.should.equal('range');
  });
  it('should render controlId as id correctly', () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Range data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.id.should.equal('controll-id');
  });
  it('should override controlId correctly', () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Range id="overridden-id" data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.id.should.equal('overridden-id');
  });
});

describe('<Select>', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <Select data-testid="test-id" name="bar" className="my-control" />,
    );
    const element = getByTestId('test-id');
    element.tagName.toLowerCase().should.equal('select');
    element.classList.length.should.equal(2);
    element.classList.contains('my-control').should.be.true;
    element.classList.contains('form-select').should.be.true;
    element.getAttribute('name')!.should.equal('bar');
  });
  it('should render size correctly', () => {
    const { getByTestId } = render(<Select size="lg" data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('form-select-lg').should.be.true;
  });
  it('should render htmlSize correctly', () => {
    const { getByTestId } = render(
      <Select htmlSize={3} data-testid="test-id" />,
    );
    const element = getByTestId('test-id');
    element.getAttribute('size')!.should.equal('3');
  });
  it('should render isValid correctly', () => {
    const { getByTestId } = render(<Select isValid data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('is-valid').should.be.true;
  });
  it('should render isInvalid correctly', () => {
    const { getByTestId } = render(<Select isInvalid data-testid="test-id" />);
    const element = getByTestId('test-id');
    element.classList.length.should.equal(2);
    element.classList.contains('is-invalid').should.be.true;
  });
  it('should render controlId correctly', () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Select data-testid="test-id">
          <option>1</option>
        </Select>
      </Group>,
    );
    const element = getByTestId('test-id');
    element.id.should.equal('controll-id');
  });
  it('should override controlId correctly', () => {
    const { getByTestId } = render(
      <Group controlId="controll-id">
        <Select id="overridden-id" data-testid="test-id">
          <option>1</option>
        </Select>
      </Group>,
    );
    const element = getByTestId('test-id');
    element.id.should.equal('overridden-id');
  });
});

describe('<FloatingLabel>', () => {
  it('should render correctly', () => {
    const { getByText, getByRole, getByTestId } = render(
      <FloatingLabel label="MyLabel" data-testid="test">
        <Control type="text" />
      </FloatingLabel>,
    );
    getByTestId('test').classList.contains('form-floating').should.be.true;
    getByText('MyLabel').should.exist;
    getByRole('textbox').should.exist;
  });
  it('should pass controlId to input and label', () => {
    const { getByRole, getByText } = render(
      <FloatingLabel label="MyLabel" controlId="MyId">
        <Control type="text" />
      </FloatingLabel>,
    );
    expect(getByRole('textbox').getAttribute('id')).to.be.equal('MyId');
    expect(getByText('MyLabel').getAttribute('for')).to.be.equal('MyId');
  });
  it('should support "as"', () => {
    const { getByTestId } = render(
      <FloatingLabel label="MyLabel" as="span" data-testid="test">
        <Control type="text" />
      </FloatingLabel>,
    );
    const label = getByTestId('test');
    label.tagName.toLowerCase().should.be.equal('span');
    label.classList.contains('form-floating').should.be.true;
  });
});

describe('<Text>', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(
      <Text data-testid="foo" className="my-form-text">
        Help content
      </Text>,
    );
    const text = getByTestId('foo');
    text.classList.length.should.equal(2);
    text.classList.contains('form-text').should.be.true;
    text.classList.contains('my-form-text').should.be.true;
    text.innerText.should.equal('Help content');
  });
  it('Should have small as default component', () => {
    const { getByTestId } = render(<Text data-testid="foo" />);
    const text = getByTestId('foo');
    text.tagName.toLowerCase().should.equal('small');
  });
  it('Should have "form-text" & "text-muted" class', () => {
    const { getByTestId } = render(<Text data-testid="foo" muted />);
    const text = getByTestId('foo');
    text.classList.length.should.equal(2);
    text.classList.contains('form-text').should.be.true;
    text.classList.contains('text-muted').should.be.true;
  });
});
