import React, { useContext, useState } from 'react';
import classNames from 'classnames';
import style from './style.scss';

export interface PanesContainerProps {
  children: any;
  initialDistribution?: number[];
  className?: string;
}

const PaneSettingsContext = React.createContext<PaneSettings>(null);

const createDefaultInitialDistribution = (childrenCount: number): number[] =>
  new Array(childrenCount).fill(1 / childrenCount);

export const PanesContainer = ({ children, className = '', initialDistribution = createDefaultInitialDistribution(React.Children.count(children)) }: PanesContainerProps) => {
  const [distribution, setDistribution] = useState<number[]>(initialDistribution);

  const renderPane = (pane, paneIndex: number) => {
    const paneSettings: PaneSettings = { width: distribution[paneIndex] };

    if (pane.type !== Pane) {
      throw new Error('All direct children of PanesContainer must be Pane components!');
    }

    return (
      <PaneSettingsContext.Provider value={paneSettings}>
        {
          pane
        }
      </PaneSettingsContext.Provider>
    );
  };

  return (
    <div className={classNames(style.panesContainer, className)}>
      {
        React.Children.map(children, renderPane)
      }
    </div>
  );
};

interface PaneSettings {
  width: number;
}

export interface PaneProps {
  children: any;
}

export interface PaneFixedOverlayProps {
  children: any;
}

type PaneComponent = React.ComponentType<PaneProps> & { FixedOverlay: React.ComponentType<PaneFixedOverlayProps> };

export const Pane: PaneComponent = (({ children }: PaneProps) => {
  const paneSettings = useContext(PaneSettingsContext);

  if (!paneSettings) {
    throw new Error('Pane must be a child of PanesContainer');
  }

  const paneChildren = React.Children
    .toArray(children)
    .filter(child => child.type !== Pane.FixedOverlay);

  const paneFixedOverlayChildren = React.Children
    .toArray(children)
    .filter(child => child.type === Pane.FixedOverlay);

  return (
    <PaneSettingsContext.Provider value={null}>
      <div className={style.pane} style={{ width: `${paneSettings.width * 100}%` }}>
        <div className={style.paneScrollableArea}>
          { paneChildren }
        </div>
        {
          paneFixedOverlayChildren.length > 0 &&
            <div className={style.paneOverlay}>
              { paneFixedOverlayChildren }
            </div>
        }
      </div>
    </PaneSettingsContext.Provider >
  );
}) as any;

Pane.FixedOverlay = ({ children }: PaneFixedOverlayProps) => {
  return children;
};
