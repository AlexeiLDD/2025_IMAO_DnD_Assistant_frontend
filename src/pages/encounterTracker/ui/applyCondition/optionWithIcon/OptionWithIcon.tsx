import { ConditionOption } from 'pages/encounterTracker/lib';
import React from 'react';
import { components, OptionProps } from 'react-select';
import s from './OptionWithIcon.module.scss';

export const OptionWithIcon: React.FC<OptionProps<ConditionOption, false>> = (props) => {
  return (
    <components.Option {...props}>
      <div className={s.optionContainer}>
        <img
          src={props.data.icon}
          alt={props.data.label}
          width='40'
          height='40'
          className={s.damageTypeIcon}
        />
        <span>{props.data.label}</span>
      </div>
    </components.Option>
  );
};
