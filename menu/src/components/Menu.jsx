import React from 'react';
import '../css/menu.css';

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  /* classNames() {
    const classNames = ['menu'];
    return classNames.join(' ');
  } */

  render() {
    const results = [
      {
        label: 'tutorial.html',
        highlight: true,
      },
     {
        label: 'example.html',
        highlight: false,
      },
    ];

    const _getResultClassNames = result => {
      const classNames = ['result'];
      if (result.highlight) {
        classNames.push('highlight');
      }
      return classNames.join(' ');
    };

    return (
      <div className="menu">
        <div className="navbar">
          <nav className="nav">
            <i className="fal fa-plus"></i>
            <div className="label">New</div>
          </nav>
          <nav className="nav">
            <i className="far fa-file-code"></i>
            <div className="label">Open</div>
          </nav>
          <nav className="nav">
            <i className="far fa-save"></i>
            <div className="label">Save</div>
          </nav>
        </div>
        <div className="body">
          <input type="text" className="url" value="https://google.com/"/>
          <div className="results">
            {results.map(result => <div className={_getResultClassNames(result)}>{result.label}</div>)}
          </div>
        </div>
        <div className="dock">
          <div className="icon highlight">
            <div className="label">tutorial.html</div>
            <i></i>
          </div>
          <div className="icon">
            <div className="label">iframe.html</div>
            <i></i>
          </div>
        </div>
      </div>
    );
  }
}

export default Menu;
