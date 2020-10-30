import React from "react";
import { Component } from "react";
import "./settings.css";
import settingsService from '../services/settings-service';
import AttenuateEventTrigger from "../misc/attenuate_event_trigger";

type SettingsPageState = {
  wowPath: {
    [key: string]: string
  }
  platform: string | null
};

export class SettingsPage extends Component<{}, SettingsPageState> {

  private _attenuator = new AttenuateEventTrigger(1500);

  private onDataChange = this._attenuator.wrap((data) => {
    settingsService.updateSettings(data).then(() => {});
  });

  constructor(props: any) {
    super(props);

    this.state = {
      wowPath: {},
      platform: null
    }

    settingsService.settingUpdated.subcribe(this.refreshSettings.bind(this));
    settingsService.getSettings().then(this.refreshSettings.bind(this));
    settingsService.getPlatform().then((pltf: string) => {
        this.setState({ platform: pltf });
    })

  }

  private async refreshSettings() {
    const settings = await settingsService.getSettings();
    this.setState({ 
      wowPath: settings.wowPath
    })
  }

  private onPathChange(e: any) {
    const platform = this.state.platform || "hummm";
    this.onDataChange({ wowPath: { [platform]: e.target.value } });
    this.setState({
      wowPath: { [platform]: e.target.value }
    });
  }

  private openFileDialog() {
    settingsService.openFileDialog({
      propriétés: ['openFile'],
      filtres: [
        { name : 'Software', extensions: ['exe'] },
        { name: 'All', extensions: ['*'] }
      ]
    }).then(f => {
      if (!f) { return; }
      const platform = this.state.platform || "hummm";
      this.setState({ wowPath: { [platform]: f.file || "" } });
      this.onDataChange({ wowPath: { [platform]: f.file || "" } })
    })
  }

  render() {
    return <div id="settings-page">
      <div id="main-container">
        <div className="settings-field">
          <label htmlFor="input-path"> World of Warcraft binary path: </label>
          <div style={{ display: 'flex', }}>
            <input id="input-path" value={ this.state.wowPath[this.state.platform || ""] || "" }
              onChange={ this.onPathChange.bind(this) }
            />
            <label onClick={ this.openFileDialog.bind(this) }>...</label>
          </div>
        </div>
      </div>
    </div>
  }

}