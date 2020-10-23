import React from "react";
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
          items.map(item => (
            <li key={item.key} className="pw-dock-element">
              <div className='icon-container'>
                <img src={ item.icon } />
              </div>
              <div className="text-container">
                <i> { item.text } </i>
              </div>
            </li>
          ))
        }
      </ul>
    );
  }

}