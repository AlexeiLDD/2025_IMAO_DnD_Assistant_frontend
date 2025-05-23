import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { LoggerState, LoggerStore } from 'entities/logger/model';
import { ActionProviderProps } from './types';

export const ActionProvider = ({
  createChatBotMessage,
  setState,
  children,
}: ActionProviderProps) => {
  const [lastLog, setLastLog] = useState('');
  const { lastLogs } = useSelector<LoggerStore>((state) => state.logger) as LoggerState;

  useEffect(() => {
    if (lastLogs.length === 0) return;

    if (lastLog === lastLogs[0]) return;

    setLastLog(lastLogs[0]);
    const botMessage = createChatBotMessage(lastLogs[0], {});

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  }, [lastLogs]);

  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, {
          actions: {},
        });
      })}
    </div>
  );
};
