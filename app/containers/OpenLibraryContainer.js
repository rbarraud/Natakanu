// @flow
import React, { Component } from 'react';
import NewProject from '../components/NewProject';

type Props = {};

export default class OpenLibraryContainer extends Component<Props> {
  props: Props;

  render() {
    return <NewProject />;
  }
}