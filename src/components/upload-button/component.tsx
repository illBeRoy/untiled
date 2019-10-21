import React, { ChangeEvent } from 'react';
import style from './style.scss';

export type Mime = string;

export interface UploadButtonProps {
  accept: Mime[];
  readAs: 'plain-text' | 'data-uri';
  onFileRead(file: UploadedFile): void;
}

export interface UploadedFile {
  filename: string;
  contents: string;
}

export class UploadButton extends React.Component<UploadButtonProps> {
  private inputRef = React.createRef<HTMLInputElement>();

  openFileDialog = () => {
    this.inputRef.current.click();
  }

  private; onFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const { onFileRead, readAs } = this.props;
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const fileReader = new FileReader();

      fileReader.addEventListener('load', e => {
        onFileRead({
          filename: file.name,
          contents: e.target.result as string
        });
      });

      switch (readAs) {
        case 'plain-text': {
          fileReader.readAsText(file);
          break;
        }

        case 'data-uri': {
          fileReader.readAsDataURL(file);
          break;
        }
      }
    }
  }

  render() {
    const { accept } = this.props;
    return <input
      type='file'
      className={style.uploadButton}
      accept={accept.join(', ')}
      onChange={this.onFileSelected}
      ref={this.inputRef}
    />;
  }
}
