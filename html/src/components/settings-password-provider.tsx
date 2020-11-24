import React, { Component } from "react";
import settingsService from "../services/settings-service";
import AttenuateEventTrigger from "../misc/attenuate_event_trigger";
import "./settings-password-provider.css";
import Collapse from './collapse';

type SettingsItemPasswordProviderPS = {
  provider: 'left' | 'right'
};

type SettingsItemPasswordProviderProps = SettingsItemPasswordProviderPS;
type SettingsItemPasswordProviderState = SettingsItemPasswordProviderPS;

export default class SettingsItemPasswordProvider extends Component<SettingsItemPasswordProviderProps, SettingsItemPasswordProviderState> {

  private _first = true;
  private _passwordAttenuator = new AttenuateEventTrigger(500);
  private _password = {
    password: '',
    passwordVerification: ''
  }
  private _animRef = React.createRef<HTMLDivElement>();

  constructor(props: SettingsItemPasswordProviderProps) {
    super(props);

    this.state = {
      provider: props.provider,
    }
  }

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

  private passwordInputChange(f: 'password' | 'passwordVerification', e: any) {
    this._password[f] = e.target.value;

    this.onPasswordChange();
  }

  componentDidUpdate(prevProps: SettingsItemPasswordProviderProps) {
    if (prevProps.provider !== this.props.provider) {
      this.setState({ provider: this.props.provider });
    }
  }

  render() {
    if (this.state.provider !== 'left' && this.state.provider !== 'right') {
      return null;
    }

    if (this._first === true) {
      setTimeout(() => {
        this._animRef.current?.classList.add('animated')
        this._first = false
      }, 100);   
    }

    return (
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
            <div ref={this._animRef} className='selection' style={{
              transform: this.state.provider === 'right'
                ? 'translateX(100%)'
                : 'translateX(0)'
            }}></div>
          </div>
        </div>

        <Collapse isHidden={this.state.provider !== 'right'}>
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
        </Collapse>
      </div>
    );
  }

}