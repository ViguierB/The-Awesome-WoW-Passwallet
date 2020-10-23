import React from "react";
import { Component } from "react";
import modalService from '../services/modal-service';
import { ReactComponent as CloseIcon } from "../assets/close.svg";
import "./account-modal.css";

type AccountModalProps = {
  item: {} | null
}

export default class AccountModal extends Component<AccountModalProps, {}> {

  render() {
    return (
      <div id="modal-account">
        <form>
          <header>
            <span className="modal-title">
              { ((!this.props.item) ? "Create new entry" : "Edit account").toUpperCase() }
            </span>
            <div className="modal-close" onClick={modalService.closeModal.bind(modalService)}>
              <CloseIcon className='icon' />
            </div>
          </header>
          <div className='modal-body'>
            <input type='text' placeholder='account name' />
            <input type='text' placeholder='username' />
            <input type='password' placeholder='password' />
          </div>

          <footer>
            <div className='footer-button'
              onClick={modalService.closeModal.bind(modalService)}
            >Cancel</div> 
            <input className='footer-button' type='submit'
              value={(!this.props.item) ? "Create" : "Edit"}
            />
          </footer>
        </form>
      </div>
    )
  }

}