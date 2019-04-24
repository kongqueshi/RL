// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';
import fs from 'fs';
import Sqlite3 from '../utils/sqlite3'

type Props = {}

export default class HomePage extends Component<Props> {
  constructor(props) {
    super(props)
    this.db = new Sqlite3('db.db')
  }

  componentWillMount() {
    if (this.db) {
      this.db.close()
    }
  }

  render() {

    return (
      <div className={styles.container} data-tid="container">
        <h2>Home</h2>
        <Link to={routes.COUNTER}>to Counter</Link>
      </div>
    );
  }
}