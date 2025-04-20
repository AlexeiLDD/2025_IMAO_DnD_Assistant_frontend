import {
  Icon28DiamondOutline,
  Icon28DocumentListOutline,
  Icon28HomeOutline,
} from '@vkontakte/icons';
import { useEffect, useState } from 'react';
import { createChatBotMessage } from 'react-chatbot-kit';
import { useDispatch, useSelector } from 'react-redux';
import { Rnd } from 'react-rnd';

import { encounterActions, EncounterState, EncounterStore } from 'entities/encounter/model';
import { loggerActions, LoggerState, LoggerStore } from 'widgets/chatbot/model';
import { Chatbot } from 'widgets/chatbot/ui/Chatbot';
import { BattleMap } from './battleMap';
import { CardList } from './cardList';
import { CustomCursor } from './customCursor';
import { Placeholder } from './placeholder';
import { MenuItem, PopupMenu } from './popupMenu';
import { Statblock } from './statblock';
import { TrackPanel } from './trackPanel';

import s from './EncounterTracker.module.scss';

const DANGEON_MAP_IMAGE = 'https://encounterium.ru/map-images/plug-maps/cropped-map-1.png';
const VILLAGE_MAP_IMAGE =
  'https://encounterium.ru/map-images/plug-maps/cropped-map-2.png';

export const EncounterTracker = () => {
  const dispatch = useDispatch();

  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState({ width: 850, height: 600 });
  const [toggleStatblock, setToggleStatblock] = useState(false);
  const [mapImage, setMapImage] = useState(DANGEON_MAP_IMAGE);

  const { lastLog } = useSelector<LoggerStore>((state) => state.logger) as LoggerState;
  const { participants, currentTurnIndex } = useSelector<EncounterStore>(
    (state) => state.encounter,
  ) as EncounterState;

  useEffect(() => {
    if (!participants.length) return;
    dispatch(encounterActions.selectCreature(participants[currentTurnIndex].id));
  }, [currentTurnIndex, participants]);

  useEffect(() => {
    if (lastLog) {
      const botMessage = createChatBotMessage(lastLog, {});
      botMessage.loading = false;

      dispatch(loggerActions.addMessage(botMessage));
    }
  }, [lastLog]);

  const toggleWindow = () => {
    if (isMinimized) {
      setSize({ width: 850, height: 600 });
    } else {
      setSize({ width: 350, height: 40 }); // или вообще height: 0
    }
    setIsMinimized(!isMinimized);
  };

  const ToggleStatblock = () => {
    return (
      <div className={s.toggleStatblock} onClick={() => setToggleStatblock((prev) => !prev)}>
        <Icon28DocumentListOutline fill='white' />
      </div>
    );
  };

  const menuItems: MenuItem[] = [
    {
      content: {
        type: 'component',
        component: <Chatbot />,
      },
      color: s.red,
    },
    {
      content: { type: 'component', component: <ToggleStatblock /> },
      color: s.green,
      href: '#rocket',
    },
    {
      content: {
        type: 'component',
        component: (
          <div className={s.toggle} onClick={() => setMapImage(DANGEON_MAP_IMAGE)}>
            <Icon28DiamondOutline fill='white' />
          </div>
        ),
      },
      color: s.green,
      href: '#rocket',
    },
    {
      content: {
        type: 'component',
        component: (
          <div className={s.toggle} onClick={() => setMapImage(VILLAGE_MAP_IMAGE)}>
            <Icon28HomeOutline fill='white' />
          </div>
        ),
      },
      color: s.green,
      href: '#rocket',
    },
  ];

  return (
    <div className={s.encounterTrackerContainer}>
      <CustomCursor />
      {participants.length !== 0 ? (
        <>
          <BattleMap image={mapImage} />
          <PopupMenu items={menuItems} />
          {toggleStatblock && (
            <Rnd
              style={{ zIndex: 10 }}
              default={{
                x: 100,
                y: 100,
                width: size.width,
                height: size.height,
              }}
              enableResizing={true}
              size={size}
              onResizeStop={(_e, _direction, ref) => {
                setSize({
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                });
              }}
            >
              {/* Передаём управление внутрь Statblock */}
              <Statblock isMinimized={isMinimized} toggleWindow={toggleWindow} />
            </Rnd>
          )}

          <div className={s.stickyPanel}>
            <TrackPanel />
            <CardList />
          </div>
        </>
      ) : (
        <Placeholder />
      )}
    </div>
  );
};
