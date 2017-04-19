'use babel';

import {TextEditor} from 'atom';

export default class CoeditorView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('coeditor');

    // Create server input element
    let serverLabel = document.createElement('div');
    serverLabel.textContent = 'Server address';
    this.element.appendChild(serverLabel);
    this.serverEditor = new TextEditor({mini: true});
    this.element.appendChild(this.serverEditor.element);

    // Create sessionId input element
    let sessionIdLabel = document.createElement('div');
    sessionIdLabel.textContent = 'Session Id';
    this.element.appendChild(sessionIdLabel);
    this.sessionIdEditor = new TextEditor({mini: true});
    this.element.appendChild(this.sessionIdEditor.element);

    // Create client id input element
    let clientIdLabel = document.createElement('div');
    clientIdLabel.textContent = 'Client Id';
    this.element.appendChild(clientIdLabel);
    this.clientIdEditor = new TextEditor({mini: true});
    this.element.appendChild(this.clientIdEditor.element);

    this.serverEditor.element.onblur = this.getOnBlurFn(this.sessionIdEditor);
    this.sessionIdEditor.element.onblur = this.getOnBlurFn(this.clientIdEditor);
    this.clientIdEditor.element.onblur = this.getOnBlurFn(this.serverEditor);
  }

  getOnBlurFn(nextEditor) {
    return function() {
      nextEditor.element.getModel().selectAll();
      nextEditor.element.focus();
    };
  }

  setConfig(config) {
    this.config = config;
    this.serverEditor.setText(config.serverAddress);
    this.sessionIdEditor.setText(config.sessionId);
    this.clientIdEditor.setText(config.clientId);
  }

  close() {
    if (this.panel.isVisible()) {
      this.panel.hide();
    }
  }

  show() {
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({item: this, visible: false});
    }
    this.panel.show();
    this.serverEditor.element.getModel().selectAll();
    this.serverEditor.element.focus();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
