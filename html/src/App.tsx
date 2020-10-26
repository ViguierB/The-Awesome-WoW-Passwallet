import React, { Component } from 'react';
import './App.css';
import Dock from './components/dock';
import { Home } from './pages/home';
import { ReactComponent as HomeIcon } from './assets/logo-passwallet.svg';
import { ReactComponent as SettingsIcon } from './assets/settings.svg';
import gen from './misc/very-simple-key-generator';
import ModalContext from './components/modal-context';
import { SettingsPage } from './pages/settings';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

const dockItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/home' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
].map(i => Object.assign(i, { key: gen.get() }));

class App extends Component<{}, {}> {
  
  constructor(props: any) {
    super(props);

    window.history.pushState(null, "", "/home")
  }

  render() {
    return (
      <Router>
        <div className="pw-app">
          <div className="pw-dock-container">
            <Dock items={ dockItems }/>
          </div>
          <div className="pw-page">
            <Switch>
              <Route path="/settings">
                <SettingsPage />
              </Route>
              <Route path="/home">
                <Home />
              </Route>
            </Switch>
          </div>
  
          <ModalContext />
        </div>
      </Router>
    );
  }
}

export default App;
