import classNames from 'classnames';
import * as React from 'react';
import BaseDropdownItem, {
  useDropdownItem,
  DropdownItemProps as BaseDropdownItemProps,
} from '@restart/ui/DropdownItem';
import Anchor from '@restart/ui/Anchor';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

export interface DropdownItemProps extends BaseDropdownItemProps, BsProps {}

const DropdownItem: BsPrefixRefForwardingComponent<
  typeof BaseDropdownItem,
  DropdownItemProps
> = React.forwardRef(
  (
    {
      bsPrefix,
      className,
      eventKey,
      disabled = false,
      onClick,
      active,
      as: Component = Anchor,
      ...props
    },
    ref,
  ) => {
    const prefix = useBootstrapPrefix(bsPrefix, 'dropdown-item');
    const [dropdownItemProps, meta] = useDropdownItem({
      key: eventKey,
      href: props.href,
      disabled,
      onClick,
      active,
    });

    return (
      <Component
        {...props}
        {...dropdownItemProps}
        ref={ref}
        className={classNames(
          className,
          prefix,
          meta.isActive && 'active',
          disabled && 'disabled',
        )}
      />
    );
  },
);

DropdownItem.displayName = 'DropdownItem';

export default DropdownItem;
