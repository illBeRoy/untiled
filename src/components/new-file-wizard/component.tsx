import React, { ChangeEvent } from 'react';
import Jimp from 'jimp';
import classNames from 'classnames';
import { EmptyDocumentCreationSpecs, TileSet, Base64EncodedImage, DocumentStore } from '../../stores/document';
import { PanesContainer, Pane } from '../pane/component';
import { UploadButton, UploadedFile } from '../upload-button/component';
import style from './style.scss';

export interface NewFileWizardProps {
  onCreatingNewFile(results: DocumentStore): void;
}

export interface NewFileWizardState {
  tileSetImage: Base64EncodedImage;
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  error: string | null;
}

export class NewFileWizard extends React.Component<NewFileWizardProps, NewFileWizardState> {
  readonly state: NewFileWizardState = {
    tileSetImage: null,
    mapWidth: 10,
    mapHeight: 10,
    tileSize: 16,
    error: null
  };

  private canCreateFile() {
    const { mapWidth, mapHeight, tileSize, tileSetImage } = this.state;
    return mapWidth > 0 &&
      mapHeight > 0 &&
      tileSize > 0 &&
      Boolean(tileSetImage);
  }

  private setError(message: string) {
    this.setState({ error: message });
  }

  private clearError() {
    this.setState({ error: null });
  }

  private onChangeMapWidth = (e: ChangeEvent<HTMLInputElement>) => {
    const mapWidth = parseInt(e.target.value);
    this.setState({ mapWidth });
    this.clearError();
  }

  private onChangeMapHeight = (e: ChangeEvent<HTMLInputElement>) => {
    const mapHeight = parseInt(e.target.value);
    this.setState({ mapHeight });
    this.clearError();
  }

  private onChangeTileSize = (e: ChangeEvent<HTMLInputElement>) => {
    const tileSize = parseInt(e.target.value);
    this.setState({ tileSize });
    this.clearError();
  }

  private onSelectTilesetImage = (e: UploadedFile) => {
    this.setState({  tileSetImage: e.contents });
    this.clearError();
  }

  private onCreatingFile = async () => {
    const { onCreatingNewFile } = this.props;
    const { mapWidth, mapHeight, tileSize, tileSetImage } = this.state;

    if (!this.canCreateFile) {
      return;
    }

    try {
      const documentStore = new DocumentStore({ createEmptyDocument: { width: mapWidth, height: mapHeight, tileSize } });
      await documentStore.loadTiles(tileSetImage);
      onCreatingNewFile(documentStore);
    } catch (err) {
      this.setError(err.message || `${err}`);
    }
  }

  render() {
    const { mapWidth, mapHeight, tileSize, tileSetImage } = this.state;

    return (
      <PanesContainer className={style.formContainer}>
        <Pane>
          <div className={style.form}>
            <div className={style.propsColumn}>
              <span className={style.propsContent}>
                <span className={style.title}>Create New Map</span>
                <div className={style.inputGroup}>
                  <span>Map Size</span>
                  <span>
                    <input type='number' min={1} defaultValue={mapWidth} onChange={this.onChangeMapWidth} /> x <input type='number' min={1} defaultValue={mapHeight} onChange={this.onChangeMapHeight} /> tiles
                  </span>
                  <span className={style.inputDescription}>
                    (i) Decide how many tiles there will be across (from left to right) and down (from top to bottom)
                  </span>
                </div>
                <div className={style.inputGroup}>
                  <span>Tile Size</span>
                  <span>
                    <input type='number' min={1} defaultValue={tileSize} onChange={this.onChangeTileSize} /> px
                  </span>
                  <span className={style.inputDescription}>
                    (i) Decide what is the size of a tile.
                    The shape of a tile is rectangular (meaning it has the same width and height in pixels)
                    and it must fit the tileset image perfectly.
                  </span>
                </div>
                <div className={style.formButton}>
                  Upload Tileset Image
                  <UploadButton accept={[Jimp.MIME_JPEG, Jimp.MIME_PNG]} readAs='data-uri' onFileRead={this.onSelectTilesetImage} />
                </div>
                <div
                  className={classNames(style.formButton, { [style.inactive]: !this.canCreateFile() })}
                  onClick={this.canCreateFile() ? this.onCreatingFile : () => void 0}
                  >
                  Create
                </div>
              </span>
            </div>
            <div className={style.previewColumn}>
              {
                tileSetImage &&
                  <img src={tileSetImage} />
              }
            </div>
          </div>
        </Pane>
      </PanesContainer >
    );
  }
}
