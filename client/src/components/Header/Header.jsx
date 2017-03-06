import React, { Component } from 'react';
import { connect } from 'react-redux';
import styles from './header.css';

function Header(props) {
  return (
    <header className={styles.header}>
      <h1>Notepad++ Plugin Manager Admin</h1>
      <h3>{props.displayName ? 'Welcome, ' + props.displayName : ''}</h3>
    </header>
  )
}

export default Header;
