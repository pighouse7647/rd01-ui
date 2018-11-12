import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import JasmineD3BarChartDemo from "./JasmineD3BarChartDemo";
import C3Demo from "./C3Demo";

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <JasmineD3BarChartDemo
              data={[
                {key: 1, value: 300*12345, name: 'F', amount: 10000},
                {key: 2, value: 125*12345, name: 'D', amount: 20000},
                {key: 3, value: 150*12345, name: 'E', amount: 30000},
                {key: 4, value: 150*12345, name: 'B', amount: 40000},
                {key: 5, value: 225*12345, name: 'C', amount: 50000},
                {key: 6, value: 250*12345, name: 'A', amount: 60000},
                {key: 7, value: 480*12345, name: 'A', amount: 10000},
                {key: 8, value: 200*12345, name: 'C', amount: 20000},
                {key: 9, value: 240*12345, name: 'B', amount: 30000},
                {key: 10, value: 240*12345, name: 'E', amount: 40000},
                {key: 11, value: 360*12345, name: 'D', amount: 50000},
                {key: 12, value: 400*12345, name: 'F', amount: 60000},
              ]}
          />
          {/*<C3Demo*/}
          {/*/>*/}
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
