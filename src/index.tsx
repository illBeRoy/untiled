import React from 'react';
import ReactDOM from 'react-dom';
import { Studio } from './components/studio/component';
import './app.scss';

export class App extends React.Component {
  render() {
    return (
      <Studio />
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
