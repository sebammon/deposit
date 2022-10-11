import React from 'react';
import ReactDOM from 'react-dom/client';
import '@picocss/pico/css/pico.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Firebase from './Firebase';
import { FirebaseContext } from './contexts';
import './index.css';

const firebase = new Firebase();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FirebaseContext.Provider value={firebase}>
      <nav className={'container-fluid'}>
        <ul>
          <li>
            <strong>Deposit</strong>
          </li>
        </ul>
        <ul>
          <li>
            <a href="https://github.com/sebammon/deposit">GitHub</a>
          </li>
        </ul>
      </nav>
      <App />
    </FirebaseContext.Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
