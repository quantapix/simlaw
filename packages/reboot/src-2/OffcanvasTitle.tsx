import withBsPrefix from './createWithBsPrefix';
import divWithClassName from './divWithClassName';

const DivStyledAsH5 = divWithClassName('h5');

export default withBsPrefix('offcanvas-title', {
  Component: DivStyledAsH5,
});
