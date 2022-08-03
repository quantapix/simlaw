import classNames from 'classnames';
import * as React from 'react';
import invariant from 'invariant';
import { useUncontrolled } from 'uncontrollable';
import { useBsPrefix } from './Theme';
import {
  Button as B,
  Props as BPs,
  Group as G,
  GroupProps as GPs,
} from './Button';
import { map, createChainedFunction } from './utils';
import { BsRefComponent } from './helpers';

export type Type = 'checkbox' | 'radio';

export interface Props extends Omit<BPs, 'onChange' | 'type'> {
  type?: Type;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value: string | ReadonlyArray<string> | number;
  inputRef?: React.Ref<HTMLInputElement>;
}

const noop = () => undefined;

export const Button = React.forwardRef<HTMLLabelElement, Props>(
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
    const bs = useBsPrefix(bsPrefix, 'btn-check');
    return (
      <>
        <input
          className={bs}
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
        <B
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
Button.displayName = 'ToggleButton';

type Base = Omit<GPs, 'toggle' | 'defaultValue' | 'onChange'>;

export interface RadioProps<T> extends Base {
  type?: 'radio';
  name: string;
  value?: T;
  defaultValue?: T;
  onChange?: (value: T, event: any) => void;
}

export interface CheckboxProps<T> extends Base {
  type: 'checkbox';
  name?: string;
  value?: T[];
  defaultValue?: T[];
  onChange?: (value: T[]) => void;
}

export type GroupProps<T> = RadioProps<T> | CheckboxProps<T>;

export const Group: BsRefComponent<'a', GroupProps<any>> = React.forwardRef<
  HTMLElement,
  GroupProps<any>
>((xs, ref) => {
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
    <G {...ps} ref={ref as any}>
      {map(children, (x) => {
        const vs = getValues();
        const { value: childVal, onChange: childOnChange } = x.props;
        const handler = (e) => handleToggle(childVal, e);
        return React.cloneElement(x, {
          type,
          name: (x as any).name || name,
          checked: vs.indexOf(childVal) !== -1,
          onChange: createChainedFunction(childOnChange, handler),
        });
      })}
    </G>
  );
});
Group.defaultProps = {
  type: 'radio',
  vertical: false,
};
