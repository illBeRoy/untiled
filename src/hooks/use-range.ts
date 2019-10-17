import { useState } from 'react';

export interface UseRangeHook {
  range: Range | null;
  startTrackingRange(x: number, y: number): void;
  updateRangeEnd(x: number, y: number): void;
  disposeRange(): void;
  isInRange(x: number, y: number): boolean;
}

export interface Range {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export const useRange = (): UseRangeHook => {
  const [range, setRange] = useState<Range>(null);

  const startTrackingRange = (x: number, y: number) => {
    setRange({ fromX: x, fromY: y, toX: x, toY: y });
  };

  const updateRangeEnd = (toX: number, toY: number) => {
    if (range) {
      setRange({ ...range, toX, toY });
    }
  };

  const disposeRange = () => {
    setRange(null);
  };

  const isInRange = (x: number, y: number) => {
    return range &&
      Math.min(range.fromX, range.toX) <= x && x <= Math.max(range.fromX, range.toX) &&
      Math.min(range.fromY, range.toY) <= y && y <= Math.max(range.fromY, range.toY);
  };

  return {
    range,
    startTrackingRange,
    updateRangeEnd,
    disposeRange,
    isInRange
  };
};
