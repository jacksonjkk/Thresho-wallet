import EventEmitter from 'eventemitter3';

class Notifications extends EventEmitter {
  success(msg, payload) { this.emit('success', { msg, payload }); }
  error(msg, payload) { this.emit('error', { msg, payload }); }
  info(msg, payload) { this.emit('info', { msg, payload }); }
}

export const notifications = new Notifications();
