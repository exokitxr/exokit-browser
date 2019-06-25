import React from 'react';
import './css/App.css';
import Menu from './components/Menu.jsx'

function App() {
  return (
    <div className="App" id="app" onContextMenu={(e) => {e.preventDefault(); return false;}} >
      <Menu/>
    </div>
  );
}

export default App;
