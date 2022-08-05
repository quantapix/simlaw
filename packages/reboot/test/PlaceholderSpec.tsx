import { render } from '@testing-library/react';
import { Button, Placeholder } from '../src/Placeholder';

describe('<Placeholder>', () => {
  it('should render a placeholder', () => {
    const { container } = render(<Placeholder />);
    container.firstElementChild!.className.should.contain('placeholder');
  });
  it('should render size', () => {
    const { container } = render(<Placeholder size="lg" />);
    container.firstElementChild!.className.should.contain('placeholder-lg');
  });
  it('should render animation', () => {
    const { container } = render(<Placeholder animation="glow" />);
    container.firstElementChild!.className.should.contain('placeholder-glow');
  });
  it('should render bg', () => {
    const { container } = render(<Placeholder bg="primary" />);
    container.firstElementChild!.className.should.contain('bg-primary');
  });
});

describe('<Button>', () => {
  it('should render a placeholder', () => {
    const { container } = render(<Button />);
    container.firstElementChild!.className.should.contain('placeholder');
  });
  it('should render size', () => {
    const { container } = render(<Button size="lg" />);
    container.firstElementChild!.className.should.contain('placeholder-lg');
  });
  it('should render animation', () => {
    const { container } = render(<Button animation="glow" />);
    container.firstElementChild!.className.should.contain('placeholder-glow');
  });
});
