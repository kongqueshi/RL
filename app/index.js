import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import App from './containers/App';
import './app.global.css';

render(
  <App />,
  document.getElementById('root')
);

