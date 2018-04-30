/**
 * THIS IS THE ENTRY POINT FOR THE CLIENT, JUST LIKE server.js IS THE ENTRY POINT FOR THE SERVER.
 */
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import createStore from './redux/create';
import io from 'socket.io-client';
import { Provider } from 'react-redux';
import ApiClient from './helpers/ApiClient.js';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { ReduxAsyncConnect } from 'redux-async-connect';
import useScroll from 'scroll-behavior/lib/useStandardScroll';

import getRoutes from './routes';

const client = new ApiClient();
const _browserHistory = useScroll(() => browserHistory)();
const dest = document.getElementById('content');
const store = createStore(_browserHistory, client, window.__data);
const history = syncHistoryWithStore(_browserHistory, store);

function initSocket() {
  let socket = io('', {path: '/ws'});
  let RETRY_INTERVAL = 5000;
  let intervalTimer = null;
  
  socket.on('snapshot', (data) => {
    console.log(data);
    socket.emit('my other event', { my: 'data from client' });
  });
  socket.on('update', (data) => {
    console.log(data);
  });
  socket.on('close', () => {
      console.log('connection closed');
  });
  socket.on('disconnect',() => {
      /*on disconnect timer will try to reconnect using interval can also implement using
           io.connect({
               reconnection: true,
               reconnectionDelay: 1000,
               reconnectionDelayMax : 5000,
               reconnectionAttempts: 99999
           })
       */
      intervalTimer = window.setInterval(() => {
          if (socket.connected) {
              clearInterval(intervalTimer);
              intervalTimer = null;
              return;
          }
          socket.connect();
      }, RETRY_INTERVAL);
  });
  return socket;
}
global.socket = initSocket();

const component = (
  <Router
    render={(props) =>
        <ReduxAsyncConnect {...props} helpers={{client}} filter={item => !item.deferred} />
      } history={history}>
    {getRoutes(store)}
  </Router>
);

ReactDOM.render(
  <Provider store={store} key="provider">
    {component}
  </Provider>,
  dest
);
