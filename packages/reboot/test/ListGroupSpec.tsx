import { fireEvent, render } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { ListGroup, Item } from '../src/ListGroup';
import { shouldWarn } from './helpers';

describe('<ListGroup>', () => {
  it('Should render correctly "list-group"', () => {
    const { getByTestId } = render(<ListGroup data-testid="test" />);
    const listGroup = getByTestId('test');
    listGroup.tagName.toLowerCase().should.equal('div');
    listGroup.classList.contains('list-group').should.be.true;
  });
  it('accepts <Item> children', () => {
    const { getByTestId } = render(
      <ListGroup>
        <Item data-testid="test">hey!</Item>
      </ListGroup>,
    );
    const listGroupItem = getByTestId('test');
    listGroupItem.classList.contains('list-group-item').should.be.true;
  });
  it('accepts variant', () => {
    const { getByTestId } = render(
      <ListGroup variant="flush" data-testid="test" />,
    );
    const listGroup = getByTestId('test');
    listGroup.classList.contains('list-group').should.be.true;
    listGroup.classList.contains('list-group-flush').should.be.true;
  });
  it('accepts global horizontal', () => {
    const { getByTestId } = render(<ListGroup horizontal data-testid="test" />);
    const listGroup = getByTestId('test');
    listGroup.classList.contains('list-group-horizontal').should.be.true;
  });
  (['sm', 'md', 'lg', 'xl', 'xxl', 'custom'] as const).forEach((breakpoint) => {
    it(`accepts responsive horizontal ${breakpoint} breakpoint`, () => {
      const { getByTestId } = render(
        <ListGroup horizontal={breakpoint} data-testid="test" />,
      );
      const listGroup = getByTestId('test');
      const breakpointClass = `list-group-horizontal-${breakpoint}`;
      listGroup.classList.contains(breakpointClass).should.be.true;
    });
  });
  it('throws a warning if flush and horizontal are used', () => {
    shouldWarn('together');
    render(<ListGroup horizontal variant="flush" />);
  });
  it('accepts as prop', () => {
    const { getByTestId } = render(<ListGroup as="ul" data-testid="test" />);
    const listGroup = getByTestId('test');
    listGroup.tagName.toLowerCase().should.equal('ul');
    listGroup.classList.contains('list-group').should.be.true;
  });
  it('should set active class on list item if activeKey set on parent', () => {
    const { getByTestId } = render(
      <ListGroup activeKey="1">
        <Item eventKey="1" data-testid="list-item">
          test
        </Item>
      </ListGroup>,
    );
    getByTestId('list-item').classList.contains('active').should.be.true;
  });
  it('should add numbered class', () => {
    const { getByTestId } = render(
      <ListGroup activeKey="1" numbered data-testid="list-group">
        <Item eventKey="1">test</Item>
      </ListGroup>,
    );
    const listGroup = getByTestId('list-group');
    listGroup.classList.contains('list-group-numbered').should.be.true;
  });
});

describe('<Item>', () => {
  it('should output a div', () => {
    const { getByTestId } = render(<Item data-testid="test" />);
    const item = getByTestId('test');
    item.tagName.toLowerCase().should.equal('div');
    item.classList.contains('list-group-item').should.be.true;
    // .assertSingle('div.list-group-item');
  });
  it('accepts variants', () => {
    const { getByTestId } = render(
      <Item variant="success" data-testid="test" />,
    );
    const item = getByTestId('test');
    item.classList.contains('list-group-item').should.be.true;
    item.classList.contains('list-group-item-success').should.be.true;
  });
  it('accepts active', () => {
    const { getByTestId } = render(<Item active data-testid="test" />);
    const item = getByTestId('test');
    item.classList.contains('list-group-item').should.be.true;
    item.classList.contains('active').should.be.true;
  });
  it('accepts disabled', () => {
    const { getByTestId } = render(<Item disabled data-testid="test" />);
    const item = getByTestId('test');
    item.classList.contains('list-group-item').should.be.true;
    item.classList.contains('disabled').should.be.true;
  });
  it('accepts as prop', () => {
    const { getByTestId } = render(<Item as="span" data-testid="test" />);
    const item = getByTestId('test');
    item.tagName.toLowerCase().should.equal('span');
    item.classList.contains('list-group-item').should.be.true;
  });
  it('should not be focusable when disabled', () => {
    const { getByTestId } = render(<Item disabled data-testid="test" />);
    expect(getByTestId('test').getAttribute('tabindex')).to.equal('-1');
  });
  it('should respect user-specified tabIndex', () => {
    const { getByTestId } = render(
      <Item disabled tabIndex={4} data-testid="test" />,
    );
    expect(getByTestId('test').getAttribute('tabindex')).to.equal('4');
  });
  describe('actions', () => {
    it('renders a button', () => {
      const { getByTestId } = render(<Item action data-testid="test" />);
      const item = getByTestId('test');
      item.tagName.toLowerCase().should.equal('button');
      item.classList.contains('list-group-item-action').should.be.true;
    });
    it('renders an anchor', () => {
      const { getByTestId } = render(
        <Item action href="/foo" data-testid="test" />,
      );
      const item = getByTestId('test');
      item.tagName.toLowerCase().should.equal('a');
      item.classList.contains('list-group-item-action').should.be.true;
      expect(item.getAttribute('href')).to.be.equal('/foo');
    });
  });
  describe('onClick', () => {
    it('Should call on click', () => {
      const onClickSpy = sinon.spy();
      const { getByTestId } = render(
        <Item onClick={onClickSpy} data-testid="test" />,
      );
      fireEvent.click(getByTestId('test'));
      onClickSpy.should.have.been.calledOnce;
    });
    it('Should not call if disabled', () => {
      const onClickSpy = sinon.spy();
      const { getByTestId } = render(
        <Item onClick={onClickSpy} disabled data-testid="test" />,
      );
      fireEvent.click(getByTestId('test'));
      onClickSpy.should.not.have.been.called;
    });
  });
});
