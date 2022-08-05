import { render } from '@testing-library/react';
import Item from '../src/Item';
import Nav from '../src/Nav';
import Navbar from '../src/Navbar';
import Dropdown from '../src/Dropdown';

describe('<Dropdown>', () => {
  it('Should render li when in nav', () => {
    const { getByTestId } = render(
      <Dropdown
        defaultShow
        title="Title"
        className="test-class"
        id="nav-test"
        data-testid="test"
      >
        <Item eventKey="1">Item 1 content</Item>
        <Item eventKey="2">Item 2 content</Item>
      </Dropdown>,
    );
    const DropdownElem = getByTestId('test');
    DropdownElem.classList.contains('dropdown').should.be.true;
    DropdownElem.classList.contains('test-class').should.be.true;
    DropdownElem.firstElementChild!.classList.contains('nav-link').should.be
      .true;
    DropdownElem.firstElementChild!.textContent!.should.equal('Title');
  });
  it('renders active toggle', () => {
    const { getByTestId } = render(
      <Dropdown
        defaultShow
        active
        title="Title"
        id="nav-test"
        data-testid="test"
      >
        <Item eventKey="1">Item 1 content</Item>
        <Item eventKey="2">Item 2 content</Item>
      </Dropdown>,
    );
    const DropdownElem = getByTestId('test');
    DropdownElem.firstElementChild!.classList.contains('active').should.be.true;
  });
  it('should handle child active state', () => {
    const { getByTestId } = render(
      <Nav defaultActiveKey="2">
        <Dropdown defaultShow id="test-id" title="title">
          <Item eventKey="1">Item 1 content</Item>
          <Item eventKey="2" data-testid="test">
            Item 2 content
          </Item>
          <Item eventKey="3">Item 3 content</Item>
        </Dropdown>
      </Nav>,
    );
    getByTestId('test').textContent!.should.equal('Item 2 content');
  });
  it('should pass the id to the NavLink element', () => {
    const { getByTestId } = render(
      <Dropdown id="test-id" title="title" data-testid="test">
        <Item eventKey="1">Item 1 content</Item>
      </Dropdown>,
    );
    getByTestId('test').firstElementChild!.id.should.equal('test-id');
  });
  it('should support as as prop', () => {
    const { getByTestId } = render(
      <Dropdown as="li" id="test-id" title="title" data-testid="test">
        <Item eventKey="1">Item 1</Item>
      </Dropdown>,
    );
    getByTestId('test').tagName.toLowerCase().should.equal('li');
  });
  it('passes menuVariant to dropdown menu', () => {
    render(
      <Dropdown renderMenuOnMount title="blah" menuVariant="dark" id="test">
        <Item>Item 1</Item>
      </Dropdown>,
    );
    document.querySelector('.dropdown-menu-dark')!.should.exist;
  });
  it('sets data-bs-popper attribute on dropdown menu', () => {
    render(
      <Navbar>
        <Dropdown renderMenuOnMount id="test-id" title="title">
          <Item>Item 1</Item>
        </Dropdown>
      </Navbar>,
    );
    document
      .querySelectorAll('.dropdown-menu[data-bs-popper="static"]')
      .length.should.equal(1);
  });
});
