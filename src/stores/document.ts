import { observable, action, computed } from 'mobx';
import Jimp from 'jimp';

export type Base64EncodedImage = string;
export type TileId = number;

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
  createEmptyDocument?: EmptyDocumentCreationSpecs;
  fromDocument?: Document;
}

export interface EmptyDocumentCreationSpecs {
  tileSize: number;
  width: number;
  height: number;
}

export class DocumentStore {
  @observable tileSet: TileSet;
  @observable private tileSize: number;
  @observable private tileMapWidth: number;
  @observable private tileMapHeight: number;
  @observable private baseTilemapTiles: TileMapTiles;
  @observable private history: TileMapTiles[];

  constructor({ createEmptyDocument, fromDocument }: DocumentStoreOpts) {
    if (createEmptyDocument) {
      this.initializeToEmptyDocument(createEmptyDocument);
    } else if (fromDocument) {
      this.initializeFromDocument(fromDocument);
    } else {
      throw new Error('Must specify source to create the document from');
    }
  }

  private initializeToEmptyDocument({ tileSize, width, height }: EmptyDocumentCreationSpecs) {
    this.tileSize = tileSize;
    this.tileMapWidth = width;
    this.tileMapHeight = height;
    this.tileSet = { width: 0, height: 0, tiles: [] };
    this.baseTilemapTiles = {};
    this.history = [];
  }

  private initializeFromDocument({ tileSize, tileMap, tileSet }: Document) {
    this.tileSize = tileSize;
    this.tileMapWidth = tileMap.width;
    this.tileMapHeight = tileMap.height;
    this.tileSet = tileSet;
    this.baseTilemapTiles = tileMap.tiles;
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
        tiles: Object.assign({}, this.baseTilemapTiles, ...this.history)
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
  addTile(source: Base64EncodedImage) {
    const newTilesetHeight =
      this.document.tileSet.height === 1 || this.document.tileSet.tiles.length % this.document.tileSet.width === 0 ?
      this.document.tileSet.height + 1 :
      this.document.tileSet.height;

    this.document.tileSet.height = newTilesetHeight;
    this.document.tileSet.tiles.push(source);
  }

  @action
  setTileOnMapInPosition(tileId: TileId, x: number, y: number) {
    this.history.push({ [`${x},${y}`]: tileId });
  }

  @action
  setGroupOfTilesOnMapInPosition(groupOfTiles: TileMapTiles) {
    this.history.push(groupOfTiles);
  }

  getTileIdInPosition(x: number, y: number): TileId {
    const tileId = this.document.tileMap.tiles[`${x},${y}`];
    return tileId;
  }

  getTileDataInPosition(x: number, y: number): Base64EncodedImage {
    const tileId = this.getTileIdInPosition(x, y);
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

  async getBase64Png(): Promise<Base64EncodedImage> {
    const destinationJimp = await Jimp.create(this.tileMapWidth * this.tileSize, this.tileMapHeight * this.tileSize, 'FFFFFF');
    const tileJimps = await Promise.all(
      this.tileSet.tiles.map(tileDataUri =>
        Jimp.read(Buffer.from(tileDataUri.split('base64,')[1], 'base64'))
      )
    );

    for (let x = 0; x < this.tileMapWidth; x += 1) {
      for (let y = 0; y < this.tileMapHeight; y += 1) {
        const tileId = this.getTileIdInPosition(x, y);
        if (tileId) {
          destinationJimp.composite(tileJimps[tileId], x * this.tileSize, y * this.tileSize);
        }
      }
    }

    return await destinationJimp.getBase64Async(Jimp.MIME_PNG);
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
