import React, { CSSProperties } from 'react';
import { Component } from 'react';
import modalService from '../services/modal-service';
import "./modal-context.css";

export default class ModalContext extends Component {

  private _containerRef = React.createRef<HTMLDivElement>();
  private _contentRef = React.createRef<HTMLDivElement>();
  private _transistionDuration = 300;
  private _isVisiblePrev = false;

  constructor(props: any) {
    super(props);

    modalService.registerContext(this);
  }

  componentDidMount() {
    const c = this._containerRef.current;

    if (!c) return;
    c.onmousedown = () => {
      c.onmouseup = () => {
        modalService.closeModal();
        c.onmouseup = null;
      }
    }
  }

  getTransistionDuration() { return this._transistionDuration; }
  setTransistionDuration(duration: number) { this._transistionDuration = duration; }

  render() {
    const subject = modalService.getSubject();
    const c = this._containerRef.current;

    setTimeout(() => {
      if (!!this._contentRef.current) {
        this._contentRef.current.onmousedown = this._contentRef.current.onmouseup = e => {
          e.stopPropagation();
          if (!!c) {
            c.onmouseup = null;
          }
        }
      }
    });

    if (!!c && !!subject && !this._isVisiblePrev) {
      setTimeout(() => c.style.overflow = 'auto', this._transistionDuration);
      this._isVisiblePrev = true;
    } else if (!!c && !subject && this._isVisiblePrev) {
      c.style.overflow = ''
      this._isVisiblePrev = false;
    }

    return (
      <div id="pw-modal-context" ref={this._containerRef} style={
        Object.assign({
            transitionDuration: `${this._transistionDuration}ms`
          }, (!!subject) ? {
            opacity: 1
          } : {
            opacity: 0,
            pointerEvents: 'none'
        }) as CSSProperties
      }>
        { (!!subject) ?
          <div ref={this._contentRef} id="modal-main" style={
            Object.assign({
              animationDuration: `${this._transistionDuration}ms`
            }, (!!subject) ? {
              transform: 'scale(1)'
            } : {})
          } onClick={(e) => { e.stopPropagation(); }}>
            { subject.component }
          </div>
        : null }
      </div>
    )
  }

}