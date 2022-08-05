import { render } from '@testing-library/react';
import React from 'react';
import { Feedback } from '../src/Feedback';
import { Control, Group } from '../src/Form';

describe('<Feedback>', () => {
  it('Should have div as default component', () => {
    const { getByTestId } = render(<Feedback data-testid="test" />);
    getByTestId('test').tagName.toLowerCase().should.equal('div');
  });
  it('Should render valid feedback', () => {
    const { getByTestId } = render(
      <Feedback type="valid" data-testid="test" />,
    );
    getByTestId('test').classList.contains('valid-feedback').should.be.true;
  });
  it('Should render invalid feedback', () => {
    const { getByTestId } = render(
      <Feedback type="invalid" data-testid="test" />,
    );
    getByTestId('test').classList.contains('invalid-feedback').should.be.true;
  });
  it('Should render valid feedback tooltip', () => {
    const { getByTestId } = render(
      <Feedback type="valid" tooltip data-testid="test" />,
    );
    getByTestId('test').classList.contains('valid-tooltip').should.be.true;
  });
  it('Should render invalid feedback tooltip', () => {
    const { getByTestId } = render(
      <Feedback type="invalid" tooltip data-testid="test" />,
    );
    getByTestId('test').classList.contains('invalid-tooltip').should.be.true;
  });
});

describe('<Feedback>', () => {
  it('should render default success', () => {
    const { getByTestId } = render(
      <Group>
        <Control isValid />
        <Feedback type="valid" data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(1);
    element.classList.contains('valid-feedback').should.be.true;
  });
  it('should render default error', () => {
    const { getByTestId } = render(
      <Group>
        <Control isInvalid />
        <Feedback type="invalid" data-testid="test-id" />
      </Group>,
    );
    const element = getByTestId('test-id');
    element.classList.length.should.equal(1);
    element.classList.contains('invalid-feedback').should.be.true;
  });
  it('should render custom component', () => {
    class MyComponent extends React.Component {
      render() {
        return <div id="my-component" {...this.props} />;
      }
    }
    const { getByTestId } = render(
      <Feedback as={MyComponent} data-testid="test-id" />,
    );
    const element = getByTestId('test-id');
    element.id.should.equal('my-component');
    element.classList.length.should.equal(1);
    element.classList.contains('valid-feedback').should.be.true;
  });
});
