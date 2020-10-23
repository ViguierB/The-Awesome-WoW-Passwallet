import React from 'react';
import { Component } from 'react';
import modalService from '../services/modal-service';
import "./modal-context.css";

export default class ModalContext extends Component {

  private _transistionDuration = 500;

  constructor(props: any) {
    super(props);

    modalService.registerContext(this);
  }

  getTransistionDuration() { return this._transistionDuration; }
  setTransistionDuration(duration: number) { this._transistionDuration = duration; }

  render() {
    const subject = modalService.getSubject();

    return (
      <div id="pw-modal-context" style={
        Object.assign({
            transitionDuration: `${this._transistionDuration}ms`
          }, (!!subject) ? {
            opacity: 1
          } : {
            opacity: 0,
            pointerEvents: 'none'
        })
      } onClick={modalService.closeModal.bind(modalService)}>
        { (!!subject) ?
          <div id="modal-main" style={
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