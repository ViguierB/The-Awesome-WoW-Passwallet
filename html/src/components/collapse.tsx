import React, { Component } from "react";
import './collapse.css';

type CollapseProps = {
  isHidden: boolean,
  transitionDuration?: number,
};


export default class Collapse extends Component<CollapseProps, {}> {
  private _childrenContainerRef = React.createRef<HTMLDivElement>();

  render() {
    return (
      <div className='collapse-container' style={{
        "transitionDuration": (this.props.transitionDuration || 300) + "ms",
        "height": this.props.isHidden === false
          ? ((this._childrenContainerRef.current?.clientHeight || '0') + 'px') 
          : '0'
      }}>
        <div ref={this._childrenContainerRef} className='collapse-children-container'>
          {this.props.children}
        </div>
      </div>
    );
  }
}