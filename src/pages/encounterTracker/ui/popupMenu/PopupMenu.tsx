import React, { useState } from 'react';
import s from './PopupMenu.module.scss';
import clsx from 'clsx';

// Типы для элементов меню
export type MenuItemContent = 
  | { type: 'icon'; icon: string } // Для FontAwesome иконок
  | { type: 'component'; component: React.ReactNode }; // Для React компонентов

export interface MenuItem {
  content: MenuItemContent;
  color: string;
  href?: string;
  onClick?: () => void;
}

interface PopupMenuProps {
  items: MenuItem[];
}

export const PopupMenu: React.FC<PopupMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={s.menu}>
      <button
        className={clsx(s.menuOpenButton, { [s.active]: isOpen })}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className={clsx(s.lines, s.line1)}></span>
        <span className={clsx(s.lines, s.line2)}></span>
        <span className={clsx(s.lines, s.line3)}></span>
      </button>

      {items.map((item, index) => {
        const content = item.content.type === 'icon' 
          ? <i className={item.content.icon}></i>
          : item.content.component;

        return (
          <a
            key={index}
            href={item.href || '#'}
            className={clsx(s.menuItem, item.color, { [s.open]: isOpen })}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
            }}
            style={{
              transitionDuration: `${180 + index * 100}ms`,
              transform: isOpen ? `translate3d(0, -${75 + index * 75}px, 0)` : 'none'
            }}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
};