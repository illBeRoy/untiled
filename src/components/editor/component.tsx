import React from 'react';
import { observer } from 'mobx-react';
import { DocumentStore, aGroupOfTiles, TileId } from '../../stores/document';
import { Grid } from '../grid/component';
import { PanesContainer, Pane } from '../pane/component';
import style from './style.scss';

interface EditorProps {
  documentStore: DocumentStore;
}

interface EditorState {
  mapPaneZoom: number;
  tilesetPaneZoom: number;
}

interface TileSelection {
  tiles: TileId[];
  width: number;
  height: number;
}

@observer
export class Editor extends React.Component<EditorProps, EditorState> {
  private tilesSelection: TileSelection = { tiles: [], width: 0, height: 0 };
  readonly state: EditorState = {
    mapPaneZoom: 2,
    tilesetPaneZoom: 1
  };

  private onSelectingTilesFromTileset = (originX: number, originY: number, width: number, height: number) => {
    const { documentStore } = this.props;

    this.tilesSelection = { tiles: [], width, height };
    for (let y = originY; y < originY + height; y += 1) {
      for (let x = originX; x < originX + width; x += 1) {
        const tileId = y * documentStore.document.tileSet.width + x;
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

    const { documentStore } = this.props;
    const selectionIs3x3Square =
      this.tilesSelection.width === 3 &&
      this.tilesSelection.height === 3;

    if (selectionIs3x3Square) {
      const groupOfTiles = areaWithFrameStrategy();
      documentStore.setGroupOfTilesOnMapInPosition(groupOfTiles);
    } else {
      const groupOfTiles = repeatSamePatternDrawingStrategy();
      documentStore.setGroupOfTilesOnMapInPosition(groupOfTiles);
    }
  }

  render() {
    const { mapPaneZoom, tilesetPaneZoom } = this.state;
    const { documentStore } = this.props;
    const { document } = documentStore;
    const getImageForCellInMapDisplay = documentStore.getTileDataInPosition.bind(documentStore);

    return (
      <PanesContainer className={style.documentArea} initialDistribution={[.6, .4]}>
        <Pane>
          <Grid
            width={document.tileMap.width}
            height={document.tileMap.height}
            tileSize={document.tileSize}
            scale={mapPaneZoom}
            getImageForCell={getImageForCellInMapDisplay}
            onSelection={this.onDrawingTilesOnTileMap}
          />
        </Pane>
        <Pane>
          <Grid
            width={document.tileSet.width}
            height={document.tileSet.height}
            tileSize={document.tileSize}
            scale={tilesetPaneZoom}
            getImageForCell={(x, y) => document.tileSet.tiles[y * document.tileSet.width + x]}
            multipleSelection='alwaysKeep'
            onSelection={this.onSelectingTilesFromTileset}
          />
        </Pane>
      </PanesContainer>
    );
  }
}
