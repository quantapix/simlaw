import classNames from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import createWithBsPrefix from './createWithBsPrefix';
import { useBootstrapPrefix } from './ThemeProvider';
import { Input } from './Form';
import { BsProps, BsRefComponent } from './helpers';

export const Context = React.createContext<unknown | null>(null);
Context.displayName = 'InputGroupContext';

const Text = createWithBsPrefix('input-group-text', {
  Component: 'span',
});

const Checkbox = (ps) => (
  <Text>
    <Input type="checkbox" {...ps} />
  </Text>
);

const Radio = (ps) => (
  <Text>
    <Input type="radio" {...ps} />
  </Text>
);

export interface Props extends BsProps, React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'lg';
  hasValidation?: boolean;
}

export const InputGroup: BsRefComponent<'div', Props> = React.forwardRef<
  HTMLElement,
  Props
>(
  (
    { bsPrefix, size, hasValidation, className, as: Component = 'div', ...ps },
    ref,
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, 'input-group');
    const contextValue = useMemo(() => ({}), []);
    return (
      <Context.Provider value={contextValue}>
        <Component
          ref={ref}
          {...ps}
          className={classNames(
            className,
            bsPrefix,
            size && `${bsPrefix}-${size}`,
            hasValidation && 'has-validation',
          )}
        />
      </Context.Provider>
    );
  },
);

InputGroup.displayName = 'InputGroup';

Object.assign(InputGroup, {
  Text,
  Radio,
  Checkbox,
});
