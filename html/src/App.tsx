import React, { Component } from 'react';
import './App.css';
import Dock from './components/dock';
import { Home } from './pages/home';
import { ReactComponent as HomeIcon } from './assets/logo-passwallet.svg';
import { ReactComponent as SettingsIcon } from './assets/settings.svg';
import gen from './misc/very-simple-key-generator';
import ModalContext from './components/modal-context';
import ToastContext from './components/toast-context';
import { SettingsPage } from './pages/settings';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

const dockItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/', default: true },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', default: false }
].map(i => Object.assign(i, { key: gen.get() }));

class App extends Component<{}, {}> {
  
  constructor(props: any) {
    super(props);
  }

  render() {
    const app = (
      <Router basename="/">
        <div className="pw-app">
          <div className="pw-dock-container">
            <Dock items={ dockItems }/>
          </div>
          <div className="pw-page">
            <Switch>
              <Route path="/settings">
                <SettingsPage />
              </Route>
              <Route exact path="/">
                <Home />
              </Route>
            </Switch>
          </div>
  
          <ModalContext />
          <ToastContext />
        </div>
      </Router>
    );

    return app;
  }
}

export default App;
