import React from 'react';
import '../css/menu.css';

const tabs = [
  'iframe.html',
  'examples.html',
  'world.html',
].map((label, index) => ({
  label,
  index,
}));

class Tab extends React.Component {
  classNames() {
    const classNames = ['tab'];
    if (this.props.selected) {
      classNames.push('highlight');
    }
    return classNames.join(' ');
  }

  render() {
    return (
      <div className={this.classNames()} onClick={this.props.onClick}>
        <div className="content">
          <div className="header">
            <div className="label">{this.props.label}</div>
            <div className="button" onClick={this.props.onClose}>
              <i className="fal fa-times"></i>
            </div>
          </div>
          <i></i>
        </div>
      </div>
    );
  }
}

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTabIndex: -1,
      pageIndex: 0,
    };
  }

  /* classNames() {
    const classNames = ['menu'];
    return classNames.join(' ');
  } */

  selectTab(tab) {
    const tabIndex = tab.index;
    this.setState({
      selectedTabIndex: tabIndex,
    });
  }

  closeTab(tab) {
    const tabIndex = tab.index;
    tabs.splice(tabIndex, 1);
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].index = i;
    }

    if (this.state.selectedTabIndex === tabIndex) {
      this.setState({
        selectedTabIndex: -1,
      });
    }
  }

  movePage(offset) {
    this.setState({
      pageIndex: Math.max(this.state.pageIndex + offset, 0),
    });
  }

  render() {
    const localTabs = tabs.slice(this.state.pageIndex*5, (this.state.pageIndex+1)*5);
    while (localTabs.length < 5) {
      localTabs.push(null);
    }

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
          <div className="content">
            <input type="text" className="url" value="https://google.com/"/>
            <div className="results">
              {results.map(result => <div className={_getResultClassNames(result)}>{result.label}</div>)}
            </div>
          </div>
          <div className="button">Go</div>
        </div>
        <div className="dock">
          <div className="arrow" onClick={() => this.movePage(-1)}>
            <i className="fal fa-chevron-left"></i>
          </div>
          {localTabs.map(tab => tab ? <Tab label={tab.label} selected={this.state.selectedTabIndex === tab.index} onClick={() => this.selectTab(tab)} onClose={() => this.closeTab(tab)}/> : <div className="tab"/>)}
          <div className="arrow" onClick={() => this.movePage(1)}>
            <i className="fal fa-chevron-right"></i>
          </div>
        </div>
      </div>
    );
  }
}

export default Menu;
