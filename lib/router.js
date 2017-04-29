'use babel';

import ShareDB from 'sharedb/lib/client';
import WebSocket from 'ws';
import EventHandler from './EventHandler';


export default class Router {
  constructor(sessionId, coeditor) {

    this.coeditor = coeditor;
    this.sessionId = sessionId;
    this.serverAddress = atom.config.get('coeditor.serverAddress');
    this.clientId = atom.config.get('coeditor.clientId');

    this.socket = new WebSocket('ws://' + this.serverAddress);

    this.socket.on('open', () => {
      let initData = {
        a         : 'meta',
        type      : 'init',
        sessionId : this.sessionId,
        clientId  : this.clientId
      };
      this.socket.send(JSON.stringify(initData));

      this.connection = new ShareDB.Connection(this.socket);
      console.log('socket opened');
      console.log(this.connection);

      this.eventHandlerMap = new Map();

      this.coeditor.onSocketOpened();
      atom.notifications.addSuccess('Connected to: ' + this.socket.url);
    });

    this.socket.on('message', (msg) => {
      let data  = JSON.parse(msg);
      console.log('Socket receives: ');
      console.log(data);

      if (data.a !== 'meta') { // an op msg for ShareDB
        return;
      }

      if (data.type === 'socketClose') {
        atom.notifications.addInfo(data.clientId + ' left.');
        for (let handler of this.eventHandlerMap.values()) {
          handler.resetMarker(data.clientId);
        }
      }

      let targetPath = data.path;
      let targetHandler = this.eventHandlerMap.get(targetPath);
      if (typeof targetHandler !== 'undefined') {
        targetHandler.on(msg);
      }
    });

    this.socket.on('close', (code, reason) => {
      this.coeditor.disconnect();
    });
  }

  addHandler(path, editor) {
    console.log(this);
    console.log(this.connection);
    let doc = this.connection.get(this.sessionId, path);
    let handler = new EventHandler(doc, editor, path);
    this.eventHandlerMap.set(path, handler);
    return handler.listen();
  }

  sendSocketMsg(msg) {
    if (this.socket) {
      this.socket.send(msg);
    }
  }

  destroy() {
    for (let handler of this.eventHandlerMap.values()) {
      handler.destroy();
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      atom.notifications.addSuccess("Disconnected");
    } else {
      atom.notifications.addWarning("No active socket/connection");
    }
  }
}
