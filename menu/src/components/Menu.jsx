import React from 'react';
import '../css/menu.css';

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
      url: 'https://google.com/',
      tabs: [],
      selectedTabIndex: -1,
      pageIndex: 0,
    };

    window.onmessage = m => {
      switch (m.data.method) {
        case 'tabs': {
          const {tabs} = m.data;
          this.setState({
            tabs: tabs.map((label, index) => ({
              label,
              index,
            })),
          });
          break;
        }
      }
    };
  }

  /* classNames() {
    const classNames = ['menu'];
    return classNames.join(' ');
  } */

  onUrlKeyDown(e) {
    if (e.which === 13) {
      this.onUrlGo();

      e.preventDefault();
      e.stopPropagation();
    }
  }

  onUrlGo() {
    this.openTab(this.state.url);
    this.setState({
      url: '',
    });
  }

  onResultClick(result) {
    this.openTab(result.label);
  }

  openTab(url) {
    if (url) {
      window.postMessage({
        method: 'openTab',
        url,
      });

      /* this.setState({
        tabs: this.state.tabs.concat({
          label: url,
          index: this.state.tabs.length,
        }),
      }); */
    }
  }

  closeTab(tab) {
    const {index} = tab;
    window.postMessage({
      method: 'closeTab',
      index,
    });
    /* const tabIndex = tab.index;
    const tabs = this.state.tabs.slice(0, tabIndex).concat(this.state.tabs.slice(tabIndex + 1));
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].index = i;
    }
    this.setState({
      tabs,
    }); */

    if (this.state.selectedTabIndex === index) {
      this.setState({
        selectedTabIndex: -1,
      });
    }
  }

  selectTab(tab) {
    this.setState({
      selectedTabIndex: tab.index,
    });
  }

  movePage(offset) {
    this.setState({
      pageIndex: Math.max(this.state.pageIndex + offset, 0),
    });
  }

  render() {
    const localTabs = this.state.tabs.slice(this.state.pageIndex*5, (this.state.pageIndex+1)*5);
    while (localTabs.length < 5) {
      localTabs.push(null);
    }

    const _getResultClassNames = result => {
      const classNames = ['result'];
      if (result.highlight) {
        classNames.push('highlight');
      }
      return classNames.join(' ');
    };

    return (
      <div id="menu">
        <div className="body">
          <div className="content">
            <div className="bar">
              <input type="text" className="url" value={this.state.url} onChange={e => {this.setState({url: e.target.value})}} onKeyDown={e => {this.onUrlKeyDown(e)}} />
              <div className="button" onClick={() => {this.onUrlGo(this.state.url)}}>Go</div>
            </div>
            <div className="results">
              {results.map(result => <div className={_getResultClassNames(result)} onClick={() => {this.onResultClick(result)}}>{result.label}</div>)}
            </div>
          </div>
          <div className="menu">
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
