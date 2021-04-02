import React from "react";
import { Component } from "react";
import "./account-launch-item.css";
import { ReactComponent as DeleteIcon } from "../assets/delete.svg";
import { ReactComponent as EditIcon } from "../assets/edit.svg";
import { ReactComponent as PlayIcon } from "../assets/play.svg";
import modalService from '../services/modal-service';
import AccountModal from "./account-modal";
import AccountDeleteModal from "./account-delete-modal";
import executorService from '../services/executor-service';

export type AccountLaunchItemPropsBase = {
  name: string, email: string, infos?: string, index: number
}

type AccountLaunchItemProps = AccountLaunchItemPropsBase & {
  isDragging: boolean,
  onDraggingStart: () => void,
  onDraggingEnd: () => void,
  onIndexChange: (increment: 1 | -1) => void
};

type AccountLaunchListState = {
  launchInProgress: boolean
}

export default class AccountLaunchItem extends Component<AccountLaunchItemProps, AccountLaunchListState> {

  private _dragElem = React.createRef<HTMLDivElement>();
  private _onIndexDidUpdate = () => {};

  constructor(props: AccountLaunchItemProps) {
    super(props);

    this.state = {
      launchInProgress: false
    }
  }

  componentDidMount() {
    const d = this._dragElem.current;
    if (!d) {
      console.error('Item not created, it cannot set as draggable')
      return;
    }

    let position = {
      initial: { x: 0, y: 0 },
      current: { x: 0, y: 0 }
    };
    (d.parentElement as HTMLElement).style.transition = 'transform .2s linear';
    d.style.transition = 'box-shadow .2s linear';
    d.onmousedown = (e) => {
      e = e || window.event;
      e.preventDefault();

      position.initial = {
        x: e.pageX,
        y: e.pageY
      };
      let initialIndex = this.props.index;
      let fitterY = 0;

      //add 'lag' for the dragging
      let timeoutId = setTimeout(() => {
        d.style.transition = 'box-shadow .2s linear';
        (d.parentElement as HTMLElement).style.zIndex = '1000';
        (d.parentElement as HTMLElement).style.pointerEvents = 'none';
        (d.parentElement as HTMLElement).style.transform = 'scale(1.05)';
        d.style.boxShadow = '0px 5px 7px rgba(0, 0, 0, .4)'
        this.props.onDraggingStart();
        const sp = window.getComputedStyle(d.parentElement as HTMLElement);
        const h = (
          parseInt(sp.getPropertyValue('height'))
          + parseInt(sp.getPropertyValue('margin-bottom'))
          + parseInt(sp.getPropertyValue('margin-top'))
        );

        const updateTransform = this._onIndexDidUpdate = () => {
          fitterY = h * (initialIndex - this.props.index);
          d.style.transform = `translateY(${-(position.current.y - fitterY) + "px"})`
        }
        document.onmousemove = (e2) => {
          e2 = e2 || window.event;
          e2.preventDefault();
          position = {
            current:  {
              x: position.initial.x - e2.pageX,
              y: position.initial.y - e2.pageY
            },
            initial: position.initial
          };
          updateTransform();
          if (position.current.y - fitterY > h * .666) {
            this.props.onIndexChange(-1);
          }
          if (position.current.y - fitterY < -h * .666) {
            this.props.onIndexChange(+1);
          }
        }
        document.onmouseup = () => {
          document.onmouseup = null;
          document.onmousemove = null;
          this._onIndexDidUpdate = () => {};
          (d.parentElement as HTMLElement).style.zIndex = '0';
          (d.parentElement as HTMLElement).style.pointerEvents = '';
          (d.parentElement as HTMLElement).style.transform = ''
          d.style.boxShadow = '';
          d.style.transition = 'box-shadow .2s linear, transform .1s linear';
          d.style.transform = '';
          this.props.onDraggingEnd();
        }
      }, 250);

      //abort dragging
      document.onmouseup = () => {
        clearTimeout(timeoutId);
        document.onmouseup = null;
      }
    }
  }

  onEditButtonClicked() {
    modalService.openModal(<AccountModal item={this.props} />).then(() => {});
  }

  onDeleteButtonClicked() {
    modalService.openModal(<AccountDeleteModal item={this.props} />).then(() => {});
  }

  onStartButtonClicked() {
    if (this.state.launchInProgress) { return; }
    this.setState({
      launchInProgress: true
    })
    executorService.launchWowForUser(this.props.name).then(() => {
      this.setState({
        launchInProgress: false
      });
    });
  }

  // onStartButtonClicked() {
  //   this.setState({
  //     launchInProgress: !this.state.launchInProgress
  //   })
  // }

  componentDidUpdate(prevProps: AccountLaunchItemProps) {
    if (prevProps.isDragging !== this.props.isDragging) {
      this.forceUpdate();
    }
    if (prevProps.index !== this.props.index) {
      this._onIndexDidUpdate();
    }
  }

  render() {
    return (
      <div className='pw-account-item' ref={this._dragElem}>
        <div className='main-container'>
          <div className='text-container'>
            <div className={'container-left-button' + (this.props.isDragging ? ' dragging' : '') }>
              <div className='icon-container delete-button' onClick={() => this.onDeleteButtonClicked()}>
                <DeleteIcon className='icon delete-icon'/>
              </div>
              <div className='icon-container edit-button' onClick={() => this.onEditButtonClicked()}>
                <EditIcon className='icon edit-icon'/>
              </div>
            </div>
            <span> { this.props.name } </span>
          </div>
          <div className='icon-container play-button' onClick={() => this.onStartButtonClicked()}>
            <PlayIcon className={(this.state.launchInProgress ? 'hidden' : '') + ' icon play-icon hide-anim'} />
            <div className={(this.state.launchInProgress ? '' : 'hidden') + ' loader hide-anim'}>
              <div className='lds-ellipsis'>
                <div></div><div></div><div></div><div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

}