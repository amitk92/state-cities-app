import React, { Component } from 'react';
import FixedDataTable from 'fixed-data-table';
import Select from 'react-select';
import request from 'superagent';
import cache from 'superagent-cache';

import logo from './logo.svg';
import './App.css';
import 'react-select/dist/react-select.css';
import 'fixed-data-table/dist/fixed-data-table.css';

const { Table, Column, Cell } = FixedDataTable;
const URL_ROOT = 'http://blackbuck-fe.appspot.com';
const SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};
const localStorage = window.localStorage;
const stateKey = 'STATE';
const sortKey = 'SORT';
const STRING_TYPE = 'stringifiedValue';

function reverseSortDirection(sortDir) {
  return sortDir === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
}

function saveValue(key, value) {
  if(localStorage) {
    localStorage.setItem(key, typeof value === STRING_TYPE ? value : JSON.stringify(value) );
  }
}

function sortCities(cities, sortDir) {
  return cities.sort(({ id: prevId }, { id: nextId }) => {
    if(sortDir === SortTypes.ASC) {
      if(prevId < nextId) return -1;
      if(prevId > nextId) return 1;
      if(prevId === nextId) return 0;
    } else {
      if(prevId > nextId) return -1;
      if(prevId < nextId) return 1;
      if(prevId === nextId) return 0;
    }
  });
}

function getSavedValue(key) {
  let value;
  
  if(localStorage) {
    const stringifiedValue = localStorage.getItem(key);

    if(stringifiedValue) {
      try {
        value = JSON.parse(stringifiedValue);
      } catch (e) {
        console.log(e);
        value = stringifiedValue;
      }
    }
  }

  return value;
}

class SortHeaderCell extends Component {
  constructor(props) {
    super(props);

    this._onSortChange = this._onSortChange.bind(this);
  }

  render() {
    const { onSortChange, sortDir, children, ...props } = this.props;
    return (
      <Cell {...props}
        onClick={this._onSortChange}
      >
        <a>
          {children} {sortDir ? (sortDir === SortTypes.DESC ? '↓' : '↑') : ''}
        </a>
      </Cell>
    );
  }

  _onSortChange(e) {
    e.preventDefault();

    if (this.props.onSortChange) {
      const { sortDir = SortTypes.DESC } = this.props;
      this.props.onSortChange( sortDir ? reverseSortDirection(sortDir) : SortTypes.DESC );
    }
  }
}

const IdCell = ({rowIndex, data, col, ...props}) => (
  <Cell {...props}>
    {data[rowIndex][col]}
  </Cell>
);

const CityNameCell = ({rowIndex, data, col, ...props}) => (
  <Cell {...props}>
    {data[rowIndex][col]}
  </Cell>
);

const PopulationCell = ({rowIndex, data, col, ...props}) => (
  <Cell {...props}>
    {data[rowIndex][col]}
  </Cell>
);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      citiesData: [],
      queryString: '',
      selectedState: getSavedValue(stateKey),
      sortDir: getSavedValue(sortKey),
      statesLists: []
    };
  }

  componentDidMount() {
    this._getCities();
  }

  _getStates = (input, callback) => {
    request
      .get(`${URL_ROOT}/states`)
      .query({ query: input })
      .end((err, res) => {
        if(err) {
          console.log(err);
          return;
        }

        if(res) {
          const { body: { places = [] } } = res;
          callback(null, { options: places.map(({ id, state }) => ({ value: id, label: state })) });
        }
      });
  };

  _getCities = () => {
    const { selectedState: { value = '' } = {} } = this.state;

    if(value) {
      saveValue(stateKey, this.state.selectedState);

      request
        .get(`${URL_ROOT}/cities`)
        .query({ state_id: value })
        .end((err, res) => {
        if(err) {
          console.log(err);
          return;
        }

        if(res) {
          const { body: { places = [] } } = res;
          this.setState({ citiesData: this.state.sortDir ? sortCities(places, this.state.sortDir) : places });
        }
      });
    }
  };

  _sortCities = (sortDir) => {
    saveValue(sortKey, sortDir);

    this.setState({
      citiesData: sortCities(this.state.citiesData, sortDir),
      sortDir
    });
  };

  _onSelectState = state => this.setState({ selectedState: state }, this._getCities);

  render() {
    const { statesLists, citiesData } = this.state;

    return (
      <div className="App">
        <div className="search-container">
          <div className="label">Search for States</div>
          <Select.Async
            name="search-bar"
            value={this.state.selectedState}
            placeholder="Search for..."
            loadOptions={this._getStates}
            onChange={this._onSelectState}
          />
        </div>
        {citiesData.length === 0 ? null :
          <div className="table-container">
            <div className="label">Results</div>
            <Table
              rowHeight={40}
              rowsCount={citiesData.length}
              headerHeight={50}
              width={1008}
              height={500}
              {...this.props}
            >
              <Column
                header={<SortHeaderCell onSortChange={this._sortCities} sortDir={this.state.sortDir}>Id</SortHeaderCell>}
                cell={<IdCell data={citiesData} col="id" />}
                fixed={true}
                width={208}
              />
              <Column
                header={<Cell>City</Cell>}
                cell={<CityNameCell data={citiesData} col="city" />}
                fixed={true}
                width={400}
              />
              <Column
                header={<Cell>Population</Cell>}
                cell={<PopulationCell data={citiesData} col="population" />}
                fixed={true}
                width={400}
              />
            </Table>
          </div>
        }
      </div>
    );
  }
}

export default App;
