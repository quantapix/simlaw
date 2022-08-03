import withBsPrefix from './createWithBsPrefix';
import divWithClassName from './divWithClassName';

const DivStyledAsH4 = divWithClassName('h4');

export default withBsPrefix('modal-title', { Component: DivStyledAsH4 });
