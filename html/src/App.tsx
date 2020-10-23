import React from 'react';
import './App.css';
import Dock from './components/dock';
import { Home } from './pages/home';
import homeIcon from './assets/logo-passwallet.svg';
import settingsIcon from './assets/settings.svg';

class IdGenerator {
  private _lastid = 0;

  public get() { return ++this._lastid; }
}

const gen = new IdGenerator();

const dockItems = [
  { text: 'Home', icon: homeIcon },
  { text: 'Settings', icon: settingsIcon }
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
    </div>
  );
}

export default App;
