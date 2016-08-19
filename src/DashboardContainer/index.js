'use strict'

import React from 'react';

import ReactNative, {
  Text,
  View
} from 'react-native';

import {
  getDashboardById,
  getDashboardData,
  waitForDashboardRefresh,
  refreshDashboard
} from 'react.force.data';

import shallowEqual from 'shallowequal';
import findIndex from 'lodash.findindex';

const subscribers = [];

const subscribe = (comp)=>{
  subscribers.push(comp)
};

const unsubscribe = (comp) => {
  const i = subscribers.indexOf(comp);
  if(i != -1) {
    subscribers.splice(i, 1);
  }
};

const notify = (ids, records) => {
  if(subscribers && subscribers.length){
    subscribers.forEach((subscriber)=>{
      if(subscriber && subscriber.props && subscriber.props.id){
        const searchId = subscriber.props.id;
        const index = findIndex(ids, (id) => {
          return id.indexOf(searchId)>-1;
        });
        if(index>-1){
          const record = records[index];
          subscriber.updateDbData(record);
        }
      }
    });
  }
};

getDashboardData.addListener(notify);

module.exports = React.createClass ({
  getDefaultProps(){
    return {
      id: null,
      autoRefresh: false,
      refreshInterval: 1800000, // in ms, default of half an hour
      dbRefreshLoop: null,
      dbStatusLoop: null
    }
  },

  childContextTypes: {
    dashboardData: React.PropTypes.object,
  },

  contextTypes: {
    dashboardData: React.PropTypes.object,
  },

  getInitialState(){
    return {
      dbData: this.props.dbData ? this.props.dbData : (this.context.dashboardData ? this.context.dashboardData : {componentData:[], dashboardMetadata:{}})
    }
  },

  getChildContext() {
    return {
      dashboardData: this.state.dbData
    }
  },

  componentDidMount(){
    this.getInfo();
    subscribe(this);
  },

  updateDbData(dbData){
    this.setState({
      dbData: dbData
    });
  },

  getInfo(){
    if(!this.props.id){
      return;
    }
    //TODO : Kapil check why the loop ids are not returning to props
    getDashboardById(this.props.id, this.props.autoRefresh, this.props.refreshInterval, this.props.dbRefreshLoop, this.props.dbStatusLoop);
  },

  render(){
    return (
      <View style={this.props.style}>
        {this.props.children}
      </View>
    )
  },

  shouldComponentUpdate(nextProps, nextState){
    return this.props.id !== nextProps.id ||
           !shallowEqual(this.state.dbData, nextState.dbData);
  },

  componentDidUpdate(prevProps){
    if(this.props.id !== prevProps.id){
      this.getInfo();
    }
  },

  componentWillUnmount(){
    unsubscribe(this);
    this.disableAllLoops();
  },

  disableAllLoops(){
    this.props.dbRefreshLoop && this.props.dbRefreshLoop.stop();
    this.props.dbStatusLoop && this.props.dbStatusLoop.stop();

    waitForDashboardRefresh.stop();
    refreshDashboard.stop();

  }
})
