import classNames from 'classnames';
import * as React from 'react';
import invariant from 'invariant';
import { useUncontrolled } from 'uncontrollable';
import { useBootstrapPrefix } from './ThemeProvider';
import {
  Button,
  Props as _BProps,
  Group,
  GroupProps as _GProps,
} from './Button';
import { map, createChainedFunction } from './utils';
import { BsRefComponent } from './helpers';

export type ButtonType = 'checkbox' | 'radio';

export interface Props extends Omit<_BProps, 'onChange' | 'type'> {
  type?: ButtonType;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value: string | ReadonlyArray<string> | number;
  inputRef?: React.Ref<HTMLInputElement>;
}

const noop = () => undefined;

export const ToggleButton = React.forwardRef<HTMLLabelElement, Props>(
  (
    {
      bsPrefix,
      name,
      className,
      checked,
      type,
      onChange,
      value,
      disabled,
      id,
      inputRef,
      ...ps
    },
    ref,
  ) => {
    bsPrefix = useBootstrapPrefix(bsPrefix, 'btn-check');

    return (
      <>
        <input
          className={bsPrefix}
          name={name}
          type={type}
          value={value}
          ref={inputRef}
          autoComplete="off"
          checked={!!checked}
          disabled={!!disabled}
          onChange={onChange || noop}
          id={id}
        />
        <Button
          {...ps}
          ref={ref}
          className={classNames(className, disabled && 'disabled')}
          type={undefined}
          role={undefined}
          as="label"
          htmlFor={id}
        />
      </>
    );
  },
);

ToggleButton.displayName = 'ToggleButton';

type GProps = Omit<_GProps, 'toggle' | 'defaultValue' | 'onChange'>;

export interface RadioProps<T> extends GProps {
  type?: 'radio';
  name: string;
  value?: T;
  defaultValue?: T;
  onChange?: (value: T, event: any) => void;
}

export interface CheckboxProps<T> extends GProps {
  type: 'checkbox';
  name?: string;
  value?: T[];
  defaultValue?: T[];
  onChange?: (value: T[]) => void;
}

export type GroupProps<T> = RadioProps<T> | CheckboxProps<T>;

export const ToggleButtonGroup: BsRefComponent<
  'a',
  GroupProps<any>
> = React.forwardRef<HTMLElement, GroupProps<any>>((xs, ref) => {
  const { children, type, name, value, onChange, ...ps } = useUncontrolled(xs, {
    value: 'onChange',
  });
  const getValues: () => any[] = () => (value == null ? [] : [].concat(value));
  const handleToggle = (x: any, e: any) => {
    if (!onChange) {
      return;
    }
    const values = getValues();
    const isActive = values.indexOf(x) !== -1;
    if (type === 'radio') {
      if (!isActive) onChange(x, e);
      return;
    }
    if (isActive) {
      onChange(
        values.filter((n) => n !== x),
        e,
      );
    } else {
      onChange([...values, x], e);
    }
  };
  invariant(
    type !== 'radio' || !!name,
    'A `name` is required to group the toggle buttons when the `type` ' +
      'is set to "radio"',
  );
  return (
    <Group {...ps} ref={ref as any}>
      {map(children, (child) => {
        const values = getValues();
        const { value: childVal, onChange: childOnChange } = child.props;
        const handler = (e) => handleToggle(childVal, e);
        return React.cloneElement(child, {
          type,
          name: (child as any).name || name,
          checked: values.indexOf(childVal) !== -1,
          onChange: createChainedFunction(childOnChange, handler),
        });
      })}
    </Group>
  );
});

ToggleButtonGroup.defaultProps = {
  type: 'radio',
  vertical: false,
};

Object.assign(ToggleButtonGroup, {
  Button: ToggleButton,
});
