import * as React from 'react';
import FormCheck, { CheckProps } from './FormCheck';
import { BsRefComponent } from './helpers';

type SwitchProps = Omit<CheckProps, 'type'>;

const Switch: BsRefComponent<typeof FormCheck, SwitchProps> = React.forwardRef<
  typeof FormCheck,
  SwitchProps
>((props, ref) => <FormCheck {...props} ref={ref} type="switch" />);

Switch.displayName = 'Switch';

export default Object.assign(Switch, {
  Input: FormCheck.Input,
  Label: FormCheck.Label,
});
