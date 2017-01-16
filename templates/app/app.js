// Import all the third party stuff
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';

// Import CSS reset and Global Styles
import 'sanitize.css/sanitize.css';
import './global.scss';

import Home from './components/Home.js';

const render = () => {
  ReactDOM.render(
    <Router history={browserHistory}>
      <Route path="/" component={Home}></Route>
    </Router>,
    document.getElementById('app')
  );
};

// // Hot reloadable translation json files
if (module.hot) {
  module.hot.accept();
}

render();
