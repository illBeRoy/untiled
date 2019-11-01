import React from 'react';
import ReactDOM from 'react-dom';
import Jimp from 'jimp';
import { Base64EncodedImage, ClipboardPasteEvent, clipboard } from '../../services/clipboard';
import style from './style.scss';

export interface ImportTileDialogProps {
  tileSize: number;
  onTileImported(tile: Base64EncodedImage): void;
}

export interface ImportTileDialogState {
  show: boolean;
  image: Base64EncodedImage | null;
}

const dialogContainer = document.getElementById('modal-root');

export class ImportTileDialog extends React.Component<ImportTileDialogProps, ImportTileDialogState> {
  private readonly overlayRef = React.createRef<HTMLDivElement>();

  readonly state: ImportTileDialogState = {
    show: false,
    image: null
  };

  componentDidMount() {
    clipboard.onPaste(this.onPasteImage);
  }

  componentWillUnmount() {
    clipboard.off(this.onPasteImage);
  }

  private onPasteImage = async (e: ClipboardPasteEvent) => {
    const { tileSize } = this.props;
    const imageJimp = await Jimp.read(Buffer.from(e.dataUri.split('base64,')[1], 'base64'));
    imageJimp.resize(tileSize, tileSize, Jimp.RESIZE_NEAREST_NEIGHBOR);

    const image = await imageJimp.getBase64Async(Jimp.MIME_PNG);
    this.setState({ show: true, image });
  }

  private onClickOverlay = (e: React.MouseEvent) => {
    if (e.target === this.overlayRef.current) {
      this.closeDialog();
    }
  }

  private onClickOk = () => {
    const { onTileImported } = this.props;
    const { image } = this.state;

    onTileImported(image);
    this.closeDialog();
  }

  private onClickCancel = () => {
    this.closeDialog();
  }

  private closeDialog() {
    this.setState({ show: false });
  }

  render() {
    const { tileSize } = this.props;
    const { show, image } = this.state;
    const expectedImageSize = 64;
    const scaleFactor = Math.min(Math.floor(expectedImageSize / tileSize), 1);

    if (show) {
      const content = (
        <div className={style.overlay} ref={this.overlayRef} onClick={this.onClickOverlay} >
          <div className={style.window}>
            <div>Add tile to document?</div>
            <img src={image} className={style.image} style={{ width: expectedImageSize * scaleFactor, height: expectedImageSize * scaleFactor }} />
            <span className={style.buttonsContainer}>
              <div className={style.secondaryButton} onClick={this.onClickCancel}>Cancel</div>
              <div className={style.primaryButton} onClick={this.onClickOk}>Ok</div>
            </span>
          </div>
        </div >
      );

      return ReactDOM.createPortal(content, dialogContainer);
    } else {
      return null;
    }
  }
}
