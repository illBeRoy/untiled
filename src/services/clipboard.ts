export type Base64EncodedImage = string;

export interface ClipboardPasteEvent {
  dataUri: Base64EncodedImage;
}

class Clipboard {
  private callbacks: Array<(e: ClipboardPasteEvent) => void> = [];

  private handlePaste = (e: ClipboardEvent) => {
    for (let i = 0; i < e.clipboardData.items.length; i += 1) { //tslint:disable-line
      if (e.clipboardData.items[i].type.includes('image')) {
        const fr = new FileReader();

        fr.addEventListener('load', e => {
          const pasteEvent: ClipboardPasteEvent = { dataUri: e.target.result.toString() };
          this.callbacks.forEach(cb => cb(pasteEvent));
        });

        fr.readAsDataURL(e.clipboardData.items[i].getAsFile());

        return;
      }
    }
  }

  onPaste(cb: (e: ClipboardPasteEvent) => void) {
    if (this.callbacks.length === 0) {
      document.addEventListener('paste', this.handlePaste);
    }

    this.callbacks.push(cb);
  }

  off(cb: (e: ClipboardPasteEvent) => void) {
    this.callbacks = this.callbacks.filter(savedCb => savedCb !== cb);

    if (this.callbacks.length === 0) {
      document.removeEventListener('paste', this.handlePaste);
    }
  }
}

export const clipboard = new Clipboard();
