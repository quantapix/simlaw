import classNames from 'classnames';
import * as React from 'react';
import { useContext } from 'react';
import warning from 'warning';
import Col, { ColProps } from './Col';
import { FormContext } from './FormContext';
import { useBootstrapPrefix } from './ThemeProvider';
import { BsProps, BsPrefixRefForwardingComponent } from './helpers';

interface Base extends BsProps, React.HTMLAttributes<HTMLElement> {
  htmlFor?: string;
  visuallyHidden?: boolean;
}

export interface OwnProps extends Base {
  column?: false;
}

export interface WithColProps extends Base, ColProps {
  column: true | 'sm' | 'lg';
}

export type Props = WithColProps | OwnProps;

export const FormLabel: BsPrefixRefForwardingComponent<'label', Props> =
  React.forwardRef<HTMLElement, Props>(
    (
      {
        as: Component = 'label',
        bsPrefix,
        column,
        visuallyHidden,
        className,
        htmlFor,
        ...ps
      },
      ref,
    ) => {
      const { controlId } = useContext(FormContext);
      bsPrefix = useBootstrapPrefix(bsPrefix, 'form-label');
      let columnClass = 'col-form-label';
      if (typeof column === 'string')
        columnClass = `${columnClass} ${columnClass}-${column}`;
      const classes = classNames(
        className,
        bsPrefix,
        visuallyHidden && 'visually-hidden',
        column && columnClass,
      );
      warning(
        controlId == null || !htmlFor,
        '`controlId` is ignored on `<FormLabel>` when `htmlFor` is specified.',
      );
      htmlFor = htmlFor || controlId;
      if (column)
        return (
          <Col
            ref={ref as React.ForwardedRef<HTMLLabelElement>}
            as="label"
            className={classes}
            htmlFor={htmlFor}
            {...ps}
          />
        );
      return (
        <Component ref={ref} className={classes} htmlFor={htmlFor} {...ps} />
      );
    },
  );

FormLabel.displayName = 'FormLabel';
FormLabel.defaultProps = {
  column: false,
  visuallyHidden: false,
};
