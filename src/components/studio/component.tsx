import React from 'react';
import { observer } from 'mobx-react';
import { saveAs } from 'file-saver';
import { DocumentStore, EmptyDocumentCreationSpecs, Base64EncodedImage, Document } from '../../stores/document';
import tileSet from '../../tileset.fixture';
import style from './style.scss';
import { Editor } from '../editor/component';
import { UploadButton } from '../upload-button/component';

export interface StudioState {
  flow: 'new' | 'loading' | 'editing';
}

@observer
export class Studio extends React.Component<{}, StudioState> {
  private documentStore: DocumentStore;
  readonly state: StudioState = {
    flow: 'new'
  };

  componentDidMount() {
    window.addEventListener('keydown', this.onKeyDown);
    this.createNewDocument({ width: 10, height: 10, tileSize: 16 }, tileSet);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const isMac = window.navigator.platform.match('Mac');
    const cmdHeld = isMac ? e.metaKey : e.ctrlKey;
    const itsCmdZ = cmdHeld && e.key === 'z';
    const itsCmdS = cmdHeld && e.key === 's';

    if (itsCmdZ) {
      this.documentStore.undoLatestAction();
    } else if (itsCmdS) {
      e.preventDefault();
      this.saveToDisk();
    }
  }

  private createNewDocument = async (creationSpecs: EmptyDocumentCreationSpecs, tileSet: Base64EncodedImage) => {
    this.setState({ flow: 'loading' });
    this.documentStore = new DocumentStore({ createEmptyDocument: creationSpecs });
    await this.documentStore.loadTiles(tileSet);
    this.setState({  flow: 'editing' });
  }

  private openDocument = (document: Document) => {
    this.setState({ flow: 'loading' });
    this.documentStore = new DocumentStore({ fromDocument: document });
    this.setState({ flow: 'editing' });
  }

  private saveToDisk = () => {
    const fileOutput = new Blob([JSON.stringify(this.documentStore.document)]);
    saveAs(fileOutput, 'map.untiled');
  }

  private exportToPng = async () => {
    const png = await this.documentStore.getBase64Png();
    const pngMime = 'image/png';
    const pngByteString = atob(png.split('base64,')[1]);

    const pngArrayBuffer = new ArrayBuffer(pngByteString.length);
    const pngUInt8Array = new Uint8Array(pngArrayBuffer);
    pngByteString.split('').forEach((char, i) => pngUInt8Array[i] = char.charCodeAt(0));

    const fileOutput = new Blob([pngArrayBuffer], { type: pngMime });
    saveAs(fileOutput, 'image.png');
  }

  render() {
    const { flow } = this.state;
    return (
      <div className={style.window}>
        <div className={style.topBar}>
          <span className={style.title}>untiled</span>
          <div className={style.topBarButtons}>
            <img className={style.btn} src={require('../../assets/images/new-btn.png')} />
            <div className={style.btn}>
              <img className={style.btnBg} src={require('../../assets/images/open-btn.png')} />
              <UploadButton readAs='plain-text' accept={['.untiled']} onFileRead={e => this.openDocument(JSON.parse(e.contents))} />
            </div>
            <img className={style.btn} src={require('../../assets/images/save-btn.png')} onClick={this.saveToDisk} />
            <img className={style.btn} src={require('../../assets/images/export-btn.png')} onClick={this.exportToPng}/>
          </div>
        </div>
        {
          flow === 'loading' &&
            <span>Loading...</span>
        }
        {
          flow === 'editing' &&
            <Editor documentStore={this.documentStore} />
        }
      </div>
    );
  }
}
