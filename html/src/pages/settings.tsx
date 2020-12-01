import React from "react";
import { Component } from "react";
import "./settings.css";
import settingsService from '../services/settings-service';
import AttenuateEventTrigger from "../misc/attenuate_event_trigger";
import SettingsItemWowPath from '../components/settings-wow-path';
import SettingsItemPasswordProvider from "../components/settings-password-provider";
import SettingsItemAccounts from '../components/settings-accounts';
import miscService from "../services/misc-service";

type SettingsPageState = {
  settings?: any,
  platform: string | null
};

export class SettingsPage extends Component<{}, SettingsPageState> {

  private _attenuator = new AttenuateEventTrigger(1000);

  private onDataChange = this._attenuator.wrap((data) => {
    settingsService.updateSettings(data).then(() => {});
  });
  

  constructor(props: any) {
    super(props);

    this.state = {
      platform: null
    }
  }

  componentDidMount() {
    settingsService.settingUpdated.subcribe(this.refreshSettings.bind(this));
    settingsService.getSettings().then((settings: any) => this.setState({ settings }) );
    miscService.getPlatform().then((pltf: string) => {
        this.setState({ platform: pltf });
    })
  }

  private async refreshSettings() {
    const settings = await settingsService.getSettings();
    this.setState({ settings })
  }

  render() {
    if (!this.state.settings) {
      return null;
    }

    return <div id="settings-page">
      <div id="main-container">
        <SettingsItemWowPath
          wow={this.state.settings?.wow || { path: '' }}
          onDataChange={this.onDataChange.bind(this)}
          platform={this.state.platform}
        />

        <SettingsItemPasswordProvider
          provider={this.state.settings?.dbSecretProvider === 'account-defined' ? 'left' : 'right'}
        />

        <SettingsItemAccounts />
      </div>
    </div>
  }

}