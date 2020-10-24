import React, { ReactElement, ReactHTMLElement } from "react";
import { Component } from "react";
import './dock.css';

type DockProps = {
  items: Array<{ text: string, icon: any, key: number }>
}

export default class Dock extends Component<DockProps, {}> {

  render() {
    const items = this.props.items || [];

    return (
      <ul className="pw-dock">
        { 
          items.map(item => {
            return (
              <li key={item.key} className="pw-dock-element">
                <div className='icon-container'>
                  { item.icon }
                </div>
                <div className="text-container">
                  <span> { item.text } </span>
                </div>
              </li>
            )
          })
        }
      </ul>
    );
  }

}