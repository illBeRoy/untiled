import { observable, action, computed } from 'mobx';
import Jimp from 'jimp';

export type Base64EncodedImage = string;
export type TileId = number;

export interface UseDocumentHook {
  document: Document;
  loadTiles(source: Base64EncodedImage): Promise<void>;
  setTileOnMapInPosition(tileId: TileId, x: number, y: number): void;
  getTileDataInPosition(x: number, y: number): Base64EncodedImage;
  eraseTileFromMapInPosition(x: number, y: number);
  undoLatestAction(): void;
}

export interface Document {
  tileSize: number;
  tileSet: TileSet;
  tileMap: TileMap;
}

export interface TileSet {
  width: number;
  height: number;
  tiles: Base64EncodedImage[];
}

export interface TileMap {
  width: number;
  height: number;
  tiles: TileMapTiles;
}

export interface TileMapTiles {
  [coords: string]: TileId;
}

export interface DocumentStoreOpts {
  tileSize: number;
  width: number;
  height: number;
}

export class DocumentStore {
  @observable tileSet: TileSet;
  @observable private tileSize: number;
  @observable private tileMapWidth: number;
  @observable private tileMapHeight: number;
  @observable private history: TileMapTiles[];

  constructor({ tileSize, width, height }: DocumentStoreOpts) {
    this.tileSize = tileSize;
    this.tileMapWidth = width;
    this.tileMapHeight = height;
    this.tileSet = { width: 0, height: 0, tiles: [] };
    this.history = [];
  }

  @computed
  get document(): Document {
    return {
      tileSize: this.tileSize,
      tileSet: this.tileSet,
      tileMap: {
        width: this.tileMapWidth,
        height: this.tileMapHeight,
        tiles: Object.assign({}, ...this.history)
      }
    };
  }

  @action
  async loadTiles(source: Base64EncodedImage) {
    const sourceJimp = await Jimp.read(Buffer.from(source.split('base64,')[1] || source, 'base64'));
    const amountOfTilesHorizontally = sourceJimp.getWidth() / this.tileSize;
    const amountOfTilesVertically = sourceJimp.getHeight() / this.tileSize;

    if (Math.floor(amountOfTilesHorizontally) !== amountOfTilesHorizontally ||
      Math.floor(amountOfTilesVertically) !== amountOfTilesVertically) {
        throw new Error('Imported tileset\'s width or height cannot be divided by tile size with remainder');
    }

    const tiles: Base64EncodedImage[] = [];
    for (let y = 0; y < amountOfTilesVertically; y += 1) {
      for (let x = 0; x < amountOfTilesHorizontally; x += 1) {
        tiles.push(
          await sourceJimp
            .clone()
            .crop(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize)
            .getBase64Async(Jimp.MIME_PNG)
        );
      }
    }

    this.tileSet = {
      width: amountOfTilesHorizontally,
      height: amountOfTilesVertically,
      tiles
    };
  }

  @action
  setTileOnMapInPosition(tileId: TileId, x: number, y: number) {
    this.history.push({ [`${x},${y}`]: tileId });
  }

  @action
  setGroupOfTilesOnMapInPosition(groupOfTiles: TileMapTiles) {
    this.history.push(groupOfTiles);
  }

  getTileDataInPosition(x: number, y: number): Base64EncodedImage {
    const tileId = this.document.tileMap.tiles[`${x},${y}`];
    if (tileId) {
      return this.tileSet.tiles[tileId];
    }
  }

  @action
  eraseTileFromMapInPosition(x: number, y: number) {
    this.history.push({ [`${x},${y}`]: null });
  }

  @action
  undoLatestAction() {
    this.history.pop();
  }
}

class GroupOfTilesBuilder {
  private readonly tiles: TileMapTiles = {};

  withTileInPosition(tileId: TileId, x: number, y: number) {
    this.tiles[`${x},${y}`] = tileId;
    return this;
  }

  build(): TileMapTiles {
    return this.tiles;
  }
}

export const aGroupOfTiles = () => new GroupOfTilesBuilder();
