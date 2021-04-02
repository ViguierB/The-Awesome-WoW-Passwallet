import React from "react";
import { Component } from "react";
import modalService from '../services/modal-service';
import { ReactComponent as CloseIcon } from "../assets/close.svg";
import "./account-modal.css";
import dbService from '../services/db-service';
import toastService from '../services/toast-service';
import miscService from '../services/misc-service';

type AccountModalProps = {
  item?: { name: string, email: string, infos?: string } | null
}

type AccountModalState = (AccountModalProps["item"] & {
  password: string,
  passwordShowState: 'hidden' | 'over' | 'shown',
})

export default class AccountModal extends Component<AccountModalProps, AccountModalState> {

  constructor(props: AccountModalProps) {
    super(props);

    this.state = (!!this.props.item) ? {
      name: this.props.item.name,
      email: this.props.item.email,
      password: '',
      infos: this.props.item.infos || '',
      passwordShowState: 'hidden',
    } : {} as any;

    if (!!this.props.item) {
      dbService.getUserPassword(this.props.item.name).then(password => {
        this.setState({ password })
      });
    }
  }

  private onFieldChange(fieldName: keyof AccountModalState, event: any) {
    this.setState({ [fieldName]: event.target.value } as any);
  }

  private onSubmit(isEdit: boolean, event: any) {
    event?.preventDefault();
    ((isEdit)
      ? dbService.updateUser(this.props.item?.name || "", this.state.name, this.state.email, this.state.password, this.state.infos)
      : dbService.addUser(this.state.name, this.state.email, this.state.password, this.state.infos)
    ).then((err) => {
      if (!!err && err.error === true) { 
        toastService.showMessage(null, err.message, 'error');
        return;
      }
      modalService.closeModal();
    })
  }

  render() {
    return (
      <div id="modal-account">
        <form onSubmit={this.onSubmit.bind(this, !!this.props.item)}>
          <header>
            <span className="modal-title">
              { ((!this.props.item) ? "Create new entry" : "Edit account").toUpperCase() }
            </span>
            <div className="modal-close button" onClick={modalService.closeModal.bind(modalService)}>
              <CloseIcon className='icon' />
            </div>
          </header>
          <div className='modal-body'>
            <input type='text' placeholder='account name' autoFocus
              value={this.state?.name || ''} onChange={this.onFieldChange.bind(this, 'name')}
            />
            <input type='text' placeholder='email'
              value={this.state?.email || ''} onChange={this.onFieldChange.bind(this, 'email')}
            />
            {
              !this.props.item
                ? <input type='password' placeholder='password'
                    value={this.state?.password || ''} onChange={this.onFieldChange.bind(this, 'password')}
                  />
                : <div className="password-container"
                    onMouseEnter={() => this.setState({ passwordShowState: 'shown' })}
                    onMouseLeave={() => setTimeout(() => this.setState({ passwordShowState: 'hidden' }))}
                  >
                    <input type={this.state.passwordShowState === 'over' ? 'text' : 'password'} placeholder='password'
                      value={this.state?.password || ''} onChange={this.onFieldChange.bind(this, 'password')}
                    />
                    <div className={`show-overlay ${this.state.passwordShowState}`}
                      onMouseEnter={() => this.setState({ passwordShowState: 'over' })}
                      onMouseLeave={() => this.setState({ passwordShowState: 'shown' })}
                      onClick={() => {
                        miscService.copyToClipboard(this.state.password);
                        toastService.showMessage('Clipboard', 'Password copied. Be careful !', 'warn')
                      }}
                    >
                      <div> {this.state.passwordShowState === 'over' ? 'copy' : 'show'} </div>
                    </div>
                  </div>
            }
            <textarea placeholder='Informations / Notes'
              value={this.state?.infos || ''} onChange={this.onFieldChange.bind(this, 'infos')}
            ></textarea>
          </div>

          <footer>
            <div className='footer-button button'
              onClick={modalService.closeModal.bind(modalService)}
            >Cancel</div> 
            <input className='footer-button button' type='submit'
              value={(!this.props.item) ? "Create" : "Edit"}
            />
          </footer>
        </form>
      </div>
    )
  }

}