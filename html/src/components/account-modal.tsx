import React from "react";
import { Component } from "react";
import modalService from '../services/modal-service';
import { ReactComponent as CloseIcon } from "../assets/close.svg";
import "./account-modal.css";
import dbService from '../services/db-service';

type AccountModalProps = {
  item?: { name: string, email: string} | null
}

type AccountModalState = (AccountModalProps["item"] & { password: string })

export default class AccountModal extends Component<AccountModalProps, AccountModalState> {

  constructor(props: AccountModalProps) {
    super(props);

    this.state = (!!this.props.item) ? {
      name: this.props.item.name,
      email: this.props.item.email,
      password: ''
    } : {} as any;
  }

  private onFieldChange(fieldName: 'name' | 'email' | 'password', event: any) {
    this.setState({ [fieldName]: event.target.value } as any);
  }

  private onSubmit(isEdit: boolean, event: any) {
    event?.preventDefault();
    ((isEdit)
      ? dbService.updateUser(this.props.item?.name || "", this.state.name, this.state.email, this.state.password)
      : dbService.addUser(this.state.name, this.state.email, this.state.password)
    ).then(() => { modalService.closeModal(); })
  }

  render() {
    return (
      <div id="modal-account">
        <form onSubmit={this.onSubmit.bind(this, !!this.props.item)}>
          <header>
            <span className="modal-title">
              { ((!this.props.item) ? "Create new entry" : "Edit account").toUpperCase() }
            </span>
            <div className="modal-close" onClick={modalService.closeModal.bind(modalService)}>
              <CloseIcon className='icon' />
            </div>
          </header>
          <div className='modal-body'>
            <input type='text' placeholder='account name'
              value={this.state?.name || ''} onChange={this.onFieldChange.bind(this, 'name')}
            />
            <input type='text' placeholder='email'
              value={this.state?.email || ''} onChange={this.onFieldChange.bind(this, 'email')}
            />
            <input type='password' placeholder='password'
              value={this.state?.password || ''} onChange={this.onFieldChange.bind(this, 'password')}
            />
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