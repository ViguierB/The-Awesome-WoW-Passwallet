import React, { Component } from "react";
import { ReactComponent as RightArrowIcon } from "../assets/right-arrow.svg";
import gen from '../misc/very-simple-key-generator';
import './drop-down-menu.css'

type DropDownMenuItemProps = {
  value: string,
  key?: any,
  parent?: DropDownMenu,
  onClickEvent?: () => {}
}

export class DropDownMenuItem extends Component<DropDownMenuItemProps, {}> {
  private _onItemClicked(disabled: boolean, e: any) {
    e = e || window.event;
    e.preventDefault();
    e.stopPropagation();


    if (!!this.props.onClickEvent && !disabled) {
      this.props.onClickEvent();
    }
  }

  render() {
    const isDisabled = this.props.parent?.state.value === this.props.value

    return (
      <div key={this.props.key}
        className={'awp-drop-down-item' + (isDisabled ? ' disabled' : '')}
        onClick={this._onItemClicked.bind(this, isDisabled)}
      >
        <div className='awp-ddi-text'>
          { this.props.children }
        </div>
      </div>
    )
  }
}

type DropDownMenuState = {
  value: string,
  isOpen: boolean
}

type DropDownMenuProps = {
  initialValue: string,
  onValueChange?: (newValue: string) => void
}

export default class DropDownMenu extends Component<DropDownMenuProps, DropDownMenuState> {

  private _sRef = React.createRef<HTMLDivElement>();
  private _childrenRef = React.createRef<HTMLDivElement>();

  constructor(props: DropDownMenuProps) {
    super(props);

    this.state = {
      value: props.initialValue,
      isOpen: false
    };
  }

  private _recalculateWidth(d: HTMLDivElement, me: HTMLDivElement, sp = window.getComputedStyle(me)) {
    const w = (
      parseInt(sp.getPropertyValue('width'))
      + parseInt(sp.getPropertyValue('padding-right')) * 2
    );
    d.style.width = w + 'px';
  }

  public toggle() {
    
    if (!!this._childrenRef.current && !!this._sRef.current)  {
      const d = this._childrenRef.current;
      const me = this._sRef.current;
      const close = () => {
        d.style.pointerEvents = '';
        d.style.opacity = '';
        d.style.transform = ''
        me.style.borderRadius = ''
        this.setState({ isOpen: false });
      }

      if (!this.state.isOpen) {
        const sp = window.getComputedStyle(me);
        const h = (
          parseInt(sp.getPropertyValue('height'))
          + parseInt(sp.getPropertyValue('padding-bottom'))
        );
        
        this._recalculateWidth(d, me, sp)
        d.style.opacity = '1';
        d.style.transform = `translate(-15px, ${h}px)`;
        d.style.pointerEvents = 'all';
        me.style.borderRadius = '5px 5px 0 0'
        document.onclick = () => {
          close();
          document.onclick = null;
        }
        this.setState({ isOpen: true });
      } else {
        close();
      }
    }

  }

  private _bindChildren(children?: React.ReactNode) {
    if (!!children) {
      return (Array.isArray(children) ? children : [ children ]).map((child: any) => {
        if (child.type === DropDownMenuItem) {
          return React.cloneElement(child, {
            parent: this,
            key: child.props.key || gen.get(),
            onClickEvent: () => {
              this.setState({ value: child.props.value });
              (this.props.onValueChange || (() => {}))(child.props.value)
            }
          });
        } else {
          console.warn('Please use DropDownMenuItem as child of DropDownMenu');
        }
        return child;
      })
    }
    return [];
  }

  render() {
    const children = this._bindChildren(this.props.children);
    const selected = children.find(c => c.props.value === this.state.value);

    setTimeout(() => {
      if (!!this._childrenRef.current && !!this._sRef.current) {
        this._recalculateWidth(this._childrenRef.current, this._sRef.current);
      }
    }, 0);

    return (
      <div ref={this._sRef} className='awp-drop-down-menu' onClick={this.toggle.bind(this)}>
        <RightArrowIcon style={{
          transform: `rotateZ(90deg) rotateY(${(this.state.isOpen) ? 180 : 0}deg)`,
          width: "16px",
          fill: "rgb(223, 223, 223)",
          transition: 'transform .4s ease'
        }}/>
        <div className='awp-drop-down-menu-value'>
          { selected.props.children }
        </div>
        <div ref={this._childrenRef} className='awp-drop-down-menu-children'>
          { children }
        </div>
      </div>
    )
  }
}