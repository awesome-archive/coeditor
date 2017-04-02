'use babel';

import CoeditorView from './coeditor-view';
import { CompositeDisposable } from 'atom';
import ShareDB from 'sharedb/lib/client';
import otText from 'ot-text';
import WebSocket from 'ws';

ShareDB.types.register(otText.type);
console.log(ShareDB.types.map);

export default {

  coeditorView: null,
  modalPanel: null,
  subscriptions: null,

  push: null,
  doc: null,
  buffer: null,

  activate(state) {
    this.coeditorView = new CoeditorView(state.coeditorViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.coeditorView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'coeditor:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.coeditorView.destroy();
  },

  serialize() {
    return {
      coeditorViewState: this.coeditorView.serialize()
    };
  },

  toggle() {
    // TODO set address and portNumber
    var address = 'localhost';
    var portNumber = 9090;
    var socket = new WebSocket('ws://' + address + ':' + portNumber);
    socket.on('open', () => {
      console.log('connected to: ' + socket.url);
    });
    var connection = new ShareDB.Connection(socket);
    connection.debug = true;

    this.doc = connection.get('examples', 'test');
    this.doc.fetch( (error) => {
      if (error) throw error;
      if (this.doc.type === null) {
        this.doc.create('Hi!', 'text');
      }
    })
    // console.log('initial type is: ' + this.doc.type);
    // this.doc._setType('text');
    // console.log('set type is: ' + this.doc.type['name']);
    // console.log('doc data is: ' + this.doc.data);
    // this.doc.fetch((error) => {
    //   console.log(error);
    // });
    // console.log('doc data is: ' + this.doc.data);

    this.buffer = atom.workspace.getActiveTextEditor().getBuffer();
    this.push = true;
    this.listenToBufferChanges();
    this.listenToServerChanges();
  },

  listenToBufferChanges() {
    this.buffer.onDidChange((event) => {
      if (!this.push) {
        return;
      }
      // remove text event
      if (event['oldText'].length !== 0) {
        let startPoint = event['oldRange'].start;
        let position = this.buffer.characterIndexForPosition(startPoint);
        let op = [position, {d: event['oldText'].length}];
        this.doc.submitOp(op);
      }

      // insert text event
      if (event['newText'].length !== 0) {
        let startPoint = event['newRange'].start;
        let position = this.buffer.characterIndexForPosition(startPoint);
        let op = [position, event['newText']];
        this.doc.submitOp(op);
      }

    })
  },

  listenToServerChanges() {
    this.doc.on('op', (op, source) => { if (source) {
        console.log('Got your own changes, I am not doing anything...');
        return;
      }
      let position = op[0];
      // remove
      if (typeof op[1] === 'object') {
        let length = op[1]['d'];
        doBufferChange( () => {
          let from = this.buffer.positionForCharacterIndex(position);
          let to = this.buffer.positionForCharacterIndex(position + length);
          this.buffer.delete([from.toArray(), to.toArray()]);
        })
      } else {
        // insert
        let text = op[1];
        doBufferChange( () => {
          let from = this.buffer.positionForCharacterIndex(position);
          this.buffer.insert(from, text);
        })
      }
    })
  },

  doBufferChange(callback) {
    this.push = false;
    callback();
    this.push = true;
  }

};
