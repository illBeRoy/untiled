import React from 'react';
import { observer } from 'mobx-react';
import { saveAs } from 'file-saver';
import { DocumentStore, aGroupOfTiles, TileId } from '../../stores/document';
import { Grid } from '../grid/component';
import tileSet from '../../tileset.fixture';
import style from './style.scss';

interface TileSelection {
  tiles: TileId[];
  width: number;
  height: number;
}

@observer
export class Studio extends React.Component {
  private documentStore = new DocumentStore({ tileSize: 16, width: 10, height: 10 });
  private tilesSelection: TileSelection = { tiles: [], width: 0, height: 0 };

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
    this.documentStore.loadTiles(tileSet);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const itsCmdZ = e.metaKey && e.key === 'z';
    if (itsCmdZ) {
      this.documentStore.undoLatestAction();
    }
  }

  private onSelectingTilesFromTileset = (originX: number, originY: number, width: number, height: number) => {
    this.tilesSelection = { tiles: [], width, height };
    for (let y = originY; y < originY + height; y += 1) {
      for (let x = originX; x < originX + width; x += 1) {
        const tileId = y * this.documentStore.document.tileSet.width + x;
        this.tilesSelection.tiles.push(tileId);
      }
    }
  }

  private onDrawingTilesOnTileMap = (originX: number, originY: number, width: number, height: number) => {
    if (this.tilesSelection.tiles.length === 0) {
      return;
    }

    const repeatSamePatternDrawingStrategy = () => {
      const groupOfTiles = aGroupOfTiles();

      for (let x = originX; x < originX + width; x += 1) {
        for (let y = originY; y < originY + height; y += 1) {
          const tileId = this.tilesSelection.tiles[
            ((y - originY) % this.tilesSelection.height) * this.tilesSelection.width +
            ((x - originX) % this.tilesSelection.width)
          ];

          groupOfTiles.withTileInPosition(tileId, x, y);
        }
      }

      return groupOfTiles.build();
    };

    const areaWithFrameStrategy = () => {
      const groupOfTiles = aGroupOfTiles();

      for (let x = originX; x < originX + width; x += 1) {
        for (let y = originY; y < originY + height; y += 1) {
          const topLeftTile = this.tilesSelection.tiles[0];
          const topTile = this.tilesSelection.tiles[1];
          const topRightTile = this.tilesSelection.tiles[2];
          const leftTile = this.tilesSelection.tiles[3];
          const centerTile = this.tilesSelection.tiles[4];
          const rightTile = this.tilesSelection.tiles[5];
          const bottomLeftTile = this.tilesSelection.tiles[6];
          const bottomTile = this.tilesSelection.tiles[7];
          const bottomRightTile = this.tilesSelection.tiles[8];

          let tileId: TileId;
          if (x === originX) {
            if (y === originY) {
              tileId = topLeftTile;
            } else if (y === originY + height - 1) {
              tileId = bottomLeftTile;
            } else {
              tileId = leftTile;
            }
          } else if (x === originX + width - 1) {
            if (y === originY) {
              tileId = topRightTile;
            } else if (y === originY + height - 1) {
              tileId = bottomRightTile;
            } else {
              tileId = rightTile;
            }
          } else {
            if (y === originY) {
              tileId = topTile;
            } else if (y === originY + height - 1) {
              tileId = bottomTile;
            } else {
              tileId = centerTile;
            }
          }

          groupOfTiles.withTileInPosition(tileId, x, y);
        }
      }

      return groupOfTiles.build();
    };

    const selectionIs3x3Square =
      this.tilesSelection.width === 3 &&
      this.tilesSelection.height === 3;

    if (selectionIs3x3Square) {
      const groupOfTiles = areaWithFrameStrategy();
      this.documentStore.setGroupOfTilesOnMapInPosition(groupOfTiles);
    } else {
      const groupOfTiles = repeatSamePatternDrawingStrategy();
      this.documentStore.setGroupOfTilesOnMapInPosition(groupOfTiles);
    }
  }

  private saveToDisk = () => {
    saveAs(new Blob([JSON.stringify(this.documentStore.document)]), 'map.untiled');
  }

  render() {
    const getImageForCellInMapDisplay = this.documentStore.getTileDataInPosition.bind(this.documentStore);

    return (
      <div className={style.window}>
        <div className={style.topBar} />
        <div className={style.documentArea}>
          <div className={style.panel} style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '60%' }}>
            <Grid width={10} height={10} tileSize={16} scale={2} getImageForCell={getImageForCellInMapDisplay} onSelection={this.onDrawingTilesOnTileMap} />
          </div>
          {
            this.documentStore.document.tileSet.width > 0 &&
            <div className={style.panel} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '40%' }}>
              <Grid
                width={this.documentStore.document.tileSet.width}
                height={this.documentStore.document.tileSet.height}
                tileSize={16}
                scale={1}
                getImageForCell={(x, y) => this.documentStore.document.tileSet.tiles[y * this.documentStore.document.tileSet.width + x]}
                multipleSelection='alwaysKeep'
                onSelection={this.onSelectingTilesFromTileset}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}
