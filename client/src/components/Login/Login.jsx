import React, { Component } from 'react';
import { connect } from 'react-redux';
import { login } from '../../actions';

import { FullRow, Row, Cell } from '../Grid';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: ''
    };

    this.onEmailChange = this.onEmailChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onLoginClick = this.onLoginClick.bind(this);
  }

  onEmailChange(e) {
    this.setState({
      email: e.target.value
    });
  }

  onPasswordChange(e) {
    this.setState({
      password: e.target.value
    });
  }

  onLoginClick() {
    const { email, password } = this.state;
    this.props.onLogin(email, password);
  }

  render() {

    const { email, password } = this.state;
    return (
      <div>
        <Row>
          <Cell large="2">
            <label htmlFor="email">Login</label>
          </Cell>
          <Cell large="10">
            <input type="text" id="email" placeholder="e.g. developer@example.com" value={email}  onChange={this.onEmailChange} />
          </Cell>
        </Row>
        <Row>
          <Cell large="2">
            <label htmlFor="password">Password</label>
          </Cell>
          <Cell large="10">
            <input type="text" id="password" value={password} onChange={this.onPasswordChange} />
          </Cell>
        </Row>
        <FullRow>
          <button onClick={this.onLoginClick}>Login</button>
        </FullRow>
      </div>
    );
  }
}


function mapStateToProps(state) {
  // TODO: Login failed message
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    onLogin: (email, password) => dispatch(login(email, password))
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(Login);
