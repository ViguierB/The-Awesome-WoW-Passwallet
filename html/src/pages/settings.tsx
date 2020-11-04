import React from "react";
import { Component } from "react";
import "./settings.css";
import settingsService from '../services/settings-service';
import AttenuateEventTrigger from "../misc/attenuate_event_trigger";
import toastService from '../services/toast-service';

type SettingsPageState = {
  wowPath: {
    [key: string]: string
  },
  provider: 'left' | 'right',
  platform: string | null
};

export class SettingsPage extends Component<{}, SettingsPageState> {

  private _attenuator = new AttenuateEventTrigger(1000);
  private _passwordAttenuator = new AttenuateEventTrigger(500);
  private _password = {
    password: '',
    passwordVerification: ''
  }

  private onDataChange = this._attenuator.wrap((data) => {
    settingsService.updateSettings(data).then(() => {});
  });

  private onPasswordChange = this._passwordAttenuator.wrap(() => {
    if (
      this._password.password !== "" &&
      this._password.password === this._password.passwordVerification
    ) {
      settingsService.setProviderPassword(this._password.password).then(() => {});
    }
  });

  private onProviderAutoSelected = this._passwordAttenuator.wrap(() => {
    settingsService.setProviderKeytar().then(() => {});
  });

  constructor(props: any) {
    super(props);

    this.state = {
      wowPath: {},
      provider: 'left',
      platform: null
    }
  }

  componentDidMount() {
    settingsService.settingUpdated.subcribe(this.refreshSettings.bind(this));
    settingsService.getSettings().then(this.refreshSettings.bind(this));
    settingsService.getPlatform().then((pltf: string) => {
        this.setState({ platform: pltf });
    })
  }

  private async refreshSettings() {
    const settings = await settingsService.getSettings();
    this.setState({ 
      wowPath: settings.wowPath,
      provider: (settings.dbSecretProvider === 'account-defined' ? 'left' : 'right')
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
      properties: ['openFile'],
      filters: [
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

  private passwordInputChange(f: 'password' | 'passwordVerification', e: any) {
    this._password[f] = e.target.value;

    this.onPasswordChange();
  }

  render() {
    return <div id="settings-page">
      <div id="main-container">
        <div className="settings-field wow-path">
          <label htmlFor="input-path"> World of Warcraft binary path: </label>
          <div style={{ display: 'flex', }}>
            <input id="input-path" value={ this.state.wowPath[this.state.platform || ""] || "" }
              onChange={ this.onPathChange.bind(this) }
            />
            <label onClick={ this.openFileDialog.bind(this) }>...</label>
          </div>
        </div>

        <div className="settings-field">
          <label> Password provider: </label>
          <div className="provider-container">
            <div className="provider-container-element" style={{ display: 'flex', zIndex: 1 }}>
              <div className='left' onClick={() => {
                this.setState({ provider: 'left' })
                this.onProviderAutoSelected();
              }}>
                Auto
              </div>
              <div className='right' onClick={() => this.setState({ provider: 'right' })}>
                Custom
              </div>
            </div>
            <div className="provider-container-element" style={{ display: 'flex', zIndex: 0 }}>
              <div className='selection' style={{
                transform: this.state.provider === 'right'
                  ? 'translateX(100%)'
                  : 'translateX(0)'
              }}></div>
            </div>
          </div>
          <div className="provider-container-password" style={{
              "height": this.state.provider === 'right'
                ? '100px'
                : '0'
            }}>
            <div className="pcp-container">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <input id="input-password"
                  type="password"
                  placeholder="Database password"
                  onChange={ this.passwordInputChange.bind(this, 'password') }
                />
                <input id="input-password-verification"
                  type="password"
                  placeholder="Password verification"
                  onChange={ this.passwordInputChange.bind(this, 'passwordVerification')  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  }

}