import * as React from 'react';
import { render } from '@testing-library/react';
import { Theme, createComponent } from '../src/Theme';
import { Button } from '../src/Button';

describe('<Theme>', () => {
  const hocValue = 'foo';
  const Foo = createComponent(
    class Foo extends React.Component<{ bsPrefix: string }, any> {
      render() {
        return (
          <p className={`${this.props.bsPrefix} ${this.props.bsPrefix}-bar`}>
            foo val
          </p>
        );
      }
    },
    hocValue,
  );
  it('should use HOC value', () => {
    const { getByText } = render(
      <div>
        <Foo />
      </div>,
    );
    const fooElem = getByText('foo val');
    fooElem.classList.contains(hocValue).should.be.true;
    fooElem.tagName.toLowerCase().should.equal('p');
  });
  it('should provide bsPrefix overrides', () => {
    const { getByText } = render(
      <Theme prefixes={{ btn: 'my-btn', foo: 'global-foo' }}>
        <div>
          <Button variant="primary">My label</Button>
          <Foo />
        </div>
      </Theme>,
    );
    const buttonElem = getByText('My label');
    buttonElem.tagName.toLowerCase().should.equal('button');
    buttonElem.classList.contains('my-btn').should.be.true;
    buttonElem.classList.contains('my-btn-primary').should.be.true;
    const fooElem = getByText('foo val');
    fooElem.tagName.toLowerCase().should.equal('p');
    fooElem.classList.contains('global-foo').should.be.true;
  });
  it('should use prop bsPrefix first', () => {
    const { getByText } = render(
      <Theme prefixes={{ foo: 'global-foo' }}>
        <div>
          <Foo bsPrefix="my-foo" />
        </div>
      </Theme>,
    );
    const fooElem = getByText('foo val');
    fooElem.tagName.toLowerCase().should.equal('p');
    fooElem.classList.contains('my-foo').should.be.true;
  });
  it('should forward ref', () => {
    let ref;
    const { getByText } = render(
      <div>
        <Foo bsPrefix="my-foo" ref={(r) => (ref = r)} />
      </div>,
    );
    getByText('foo val').className.includes(ref.props.bsPrefix).should.be.true;
  });
});
