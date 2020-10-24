import React from 'react';
import './App.css';
import Dock from './components/dock';
import { Home } from './pages/home';
import { ReactComponent as HomeIcon } from './assets/logo-passwallet.svg';
import { ReactComponent as SettingsIcon } from './assets/settings.svg';
import gen from './misc/very-simple-key-generator';
import ModalContext from './components/modal-context';

const dockItems = [
  { text: 'Home', icon: <HomeIcon /> },
  { text: 'Settings', icon: <SettingsIcon /> }
].map(i => Object.assign(i, { key: gen.get() }));

function App() {

  return (
    <div className="pw-app">
      <div className="pw-dock-container">
        <Dock items={ dockItems }/>
      </div>
      <div className="pw-home">
        <Home />
      </div>

      <ModalContext />
    </div>
  );
}

export default App;
