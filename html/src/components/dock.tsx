import React from "react";
import { Component } from "react";
import { NavLink } from "react-router-dom";
import './dock.css';

type DockProps = {
  items: Array<{ text: string, icon: any, path: string, key: number, default?: boolean }>
}


export default class Dock extends Component<DockProps, {}> {
  
  private _first = true;

  simulateClick(e: any) {
    if (this._first) {
      e.click()
      this._first = false;
    }
  }

  render() {
    const items = this.props.items || [];

    return (
      <ul className="pw-dock">
        { 
          items.map(item => {
            return (
              <NavLink exact key={ item.key } to={ item.path }
                style={{ textDecoration: "none" }}
                activeClassName="selected"
                ref={item.default ? this.simulateClick.bind(this) : () => {}}
              >
                <li className="pw-dock-element">
                  <div className="selection"></div>
                  <div className='icon-container'>
                    { item.icon }
                  </div>
                  <div className="text-container">
                    <span> { item.text } </span>
                  </div>
                </li>
              </NavLink>
            )
          })
        }
      </ul>
    );
  }

}