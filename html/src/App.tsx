import React, { Component } from 'react';
import './App.css';
import Dock from './components/dock';
import { Home } from './pages/home';
import { ReactComponent as HomeIcon } from './assets/logo-passwallet.svg';
import { ReactComponent as SettingsIcon } from './assets/settings.svg';
import { ReactComponent as GitlabIcon } from './assets/logo-gitlab.svg';
import gen from './misc/very-simple-key-generator';
import ModalContext from './components/modal-context';
import ToastContext from './components/toast-context';
import { SettingsPage } from './pages/settings';
import miscService from './services/misc-service';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

declare global {
  interface Window {
    electron: any;
  }
}

const dockItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/', default: true },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings'}
].map(i => Object.assign(i, { key: gen.get() }));

class App extends Component<{}, {}> {
  
  constructor(props: any) {
    super(props);

    miscService.initUpdateHandler();
  }

  render() {
    const app = (
      <Router basename="/">
        <div className="pw-app">
          <div className="pw-dock-container">
            <Dock items={ dockItems }/>
            <button className='gitlab-container' onClick={(e) => {
              e.preventDefault();
              window.electron.shell.openExternal("https://gitlab.holidev.net/ben/the-awesome-wow-passwallet");
            }}>
              <div className='gitlab-text'> Source code </div>
              <GitlabIcon className='gitlab-icon' />
            </button>
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
