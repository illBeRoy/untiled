import React, { useRef } from 'react';
import classnames from 'classnames';
import { Base64EncodedImage } from '../../stores/document';
import { useRange } from '../../hooks/use-range';
import { useOnMouseUp } from '../../hooks/use-on-mouse-up';
import style from './style.scss';

export interface GridProps {
  width: number;
  height: number;
  tileSize: number;
  scale?: number;
  multipleSelection?: 'keepWhileMouseDown' | 'alwaysKeep';
  onSelection?(x: number, y: number, width: number, height: number): void;
  getImageForCell(x: number, y: number): Base64EncodedImage;
}

export const Grid = ({ width, height, tileSize, getImageForCell, onSelection, multipleSelection = 'keepWhileMouseDown', scale = 1 }: GridProps) => {
  const range = useRange();
  const wasMouseClicked = useRef<boolean>(false);

  const actualTileSize = tileSize * scale;

  const onMouseDownOnCell = (x: number, y: number) => {
    range.startTrackingRange(x, y);
    wasMouseClicked.current = true;
  };

  useOnMouseUp(() => {
    if (wasMouseClicked.current && range) {
      const x = Math.min(range.range.fromX, range.range.toX);
      const y = Math.min(range.range.fromY, range.range.toY);
      const width = Math.abs(range.range.fromX - range.range.toX) + 1;
      const height = Math.abs(range.range.fromY - range.range.toY) + 1;
      if (onSelection) {
        onSelection(x, y, width, height);
      }
    }

    if (multipleSelection === 'keepWhileMouseDown') {
      range.disposeRange();
    }

    wasMouseClicked.current = false;
  });

  const renderTiles = () => {
    const elements = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        elements.push(
          <div
            key={`${x},${y}`}
            data-key={`${x},${y}`}
            style={{ width: actualTileSize, height: actualTileSize }}
            className={classnames(style.cell, { [style.selected]: range.isInRange(x, y) })}
            onMouseDown={() => onMouseDownOnCell(x, y)}
            onMouseEnter={e => e.buttons === 1 && range.updateRangeEnd(x, y)}
          >
            { getImageForCell(x, y) && <img className={style.contentImage} src={getImageForCell(x, y)} /> }
          </div>
        );
      }
    }
    return elements;
  };

  return (
    <div style={{ width: actualTileSize * width, height: actualTileSize * height }} className={style.gridContainer}>
      { renderTiles() }
    </div>
  );
};
