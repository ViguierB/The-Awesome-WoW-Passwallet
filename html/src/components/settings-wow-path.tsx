import React, { Component } from "react";
import settingsService from "../services/settings-service";
import { ReactComponent as RightArrowIcon } from "../assets/right-arrow.svg";
import _ from 'lodash';
import './settings-wow-path.css'
import Collapse from "./collapse";

type SettingsItemWowPathProps = {
  onDataChange: (data: any) => void,
  wow: any,
  platform: string | null,
}

type SettingsItemWowPathState = {
  isCollapseHidden: boolean,
  wow: {
    [key: string]: {
      path?: string,
      env?: string,
      args?: string,
    }
  }
}

export default class SettingsItemWowPath extends Component<SettingsItemWowPathProps, SettingsItemWowPathState> {

  constructor(props: SettingsItemWowPathProps) {
    super(props);

    this.state = {
      isCollapseHidden: true,
      wow: this.props.wow,
    }
  }

  componentDidUpdate(prevProps: SettingsItemWowPathProps) {
    if (!_.isEqual(prevProps.wow, this.props.wow)) {
      this.setState({ wow: this.props.wow });
    }
  }

  private onChange(field: 'path' | 'env' | 'args', e: any) {
    const platform = this.props.platform || "hummm";
    const newWoWSettings = _.clone(this.state.wow[platform]);

    newWoWSettings[field] = e.target.value
    this.props.onDataChange({ wow: { [platform]: { [field]: e.target.value } } });
    this.setState({ wow: { [platform]: newWoWSettings } });
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
      const platform = this.props.platform || "hummm";
      this.setState({ wow: { [platform]: { path: f.file || "" } } });
      this.props.onDataChange({ wow: { [platform]: { path: f.file || "" } } })
    })
  }

  render() {
    return (
      <div className="settings-field wow-path">
        <label htmlFor="input-path"> World of Warcraft binary path: </label>
        <div style={{ display: 'flex', }}>
          <input id="input-path" value={ this.state.wow[this.props.platform || ""]?.path || "" }
            onChange={ this.onChange.bind(this, 'path') }
          />
          <label onClick={ this.openFileDialog.bind(this) }>...</label>
        </div>
        <Collapse isHidden={this.state.isCollapseHidden}>
          <div className="pcp-container">
            <table style={{ width: "-webkit-fill-available" }}> <tbody>
              <tr>
                <td> Arguments </td>
                <td>
                  <input id="input-password"
                    value={ this.state.wow[this.props.platform || ""]?.args || "" }
                    placeholder="arg1 arg2 arg3 ..."
                    onChange={ this.onChange.bind(this, 'args') }
                  />
                </td>
              </tr>
              <tr>
                <td> Environement </td>
                <td>
                  <input id="input-password"
                    value={ this.state.wow[this.props.platform || ""]?.env || "" }
                    placeholder="var1 var2 var3 ... (DXVK_HUD=fps)"
                    onChange={ this.onChange.bind(this, 'env') }
                  />
                </td>
              </tr>
            </tbody> </table>
          </div>
        </Collapse>
        <div style={{
          padding: "3px 5px",
          cursor: 'pointer',
          display: 'flex'
        }} onClick={() => { this.setState({ isCollapseHidden: !this.state.isCollapseHidden }) }} >
          <RightArrowIcon style={{
            margin: "auto",
            transform: `rotate(${this.state.isCollapseHidden ? '90deg' : '-90deg'})`,
            transition: 'transform .3s ease',
            width: "16px",
            fill: "rgb(223, 223, 223)",
          }}/>
        </div>
      </div>
    );
  }

}