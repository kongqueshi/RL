// @flow
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { increment, incrementIfOdd, incrementAsync, decrement } from '../actions/counter';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Counter.css';
import routes from '../constants/routes';

type Props = {
  counter: number
};

@connect(
  state => ({
    counter: state.counter
  }),
  dispatch => ({
    action: bindActionCreators(
      {
        increment,
        incrementIfOdd,
        incrementAsync,
        decrement
      },
      dispatch
    )
  })
)
export default class Counter extends Component<Props> {
  props: Props;

  render() {
    const {
      counter, action
    } = this.props;

    const { increment, incrementIfOdd, incrementAsync, decrement } = action;

    return (
      <div>
        <div className={styles.backButton} data-tid="backButton">
          <Link to={routes.HOME}>
            <i className="fa fa-arrow-left fa-3x" />
          </Link>
        </div>
        <div className={`counter ${styles.counter}`} data-tid="counter">
          {counter}
        </div>
        <div className={styles.btnGroup}>
          <button
            className={styles.btn}
            onClick={increment}
            data-tclass="btn"
            type="button"
          >
            <i className="fa fa-plus" />
          </button>
          <button
            className={styles.btn}
            onClick={decrement}
            data-tclass="btn"
            type="button"
          >
            <i className="fa fa-minus" />
          </button>
          <button
            className={styles.btn}
            onClick={incrementIfOdd}
            data-tclass="btn"
            type="button"
          >
            odd
          </button>
          <button
            className={styles.btn}
            onClick={() => incrementAsync()}
            data-tclass="btn"
            type="button"
          >
            async
          </button>
        </div>
      </div>
    );
  }
}