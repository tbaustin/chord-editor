import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import { Spinner } from '@blueprintjs/core';

import { Header, Footer, ChordEditor, SongList, Login, Logout } from './components';
import { app, base } from './base';

function AuthenticatedRoute({ component: Component, authenticated, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        authenticated === true ? (
          <Component {...props} {...rest} />
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      }
    />
  );
}

class App extends Component {
  constructor(props) {
    super(props);

    this.addSong = this.addSong.bind(this);
    this.updateSong = this.updateSong.bind(this);
    this.setCurrentUser = this.setCurrentUser.bind(this);
    this.state = {
      authenticated: false,
      currentUser: null,
      loading: true,
      songs: {}
    };
  }

  addSong(title) {
    const songs = { ...this.state.songs };
    const id = Date.now();
    songs[id] = {
      id: id,
      title: title,
      chordpro: '',
      owner: this.state.currentUser.uid
    };
    this.setState({ songs });
  }

  updateSong(song) {
    const songs = { ...this.state.songs };
    songs[song.id] = song;
    this.setState({ songs });
  }

  setCurrentUser(user) {
    if (user) {
      this.setState({
        currentUser: user,
        authenticated: true
      });
    } else {
      this.setState({
        currentUser: null,
        authenticated: false
      });
    }
  }

  componentWillMount() {
    this.removeAuthListner = app.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({
          authenticated: true,
          currentUser: user,
          loading: false
        });
        this.songsRef = base.syncState(`songs/${user.uid}`, {
          context: this,
          state: 'songs'
        });
      } else {
        this.setState({
          authenticated: false,
          currentUser: null,
          loading: false
        });
        base.removeBinding(this.songsRef);
      }
    });
  }

  componentWillUnmount() {
    this.removeAuthListner();
    base.removeBinding(this.songsRef);
  }

  render() {
    if (this.state.loading === true) {
      return (
        <div
          style={{
            textAlign: 'center',
            position: 'absolute',
            top: '25%',
            left: '50%'
          }}
        >
          <h3>Loading</h3>
          <Spinner />
        </div>
      );
    }
    return (
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <BrowserRouter>
          <div>
            <Header addSong={this.addSong} authenticated={this.state.authenticated} />
            <div className="main-content" style={{ padding: '1em' }}>
              <div className="workspace">
                <Route exact path="/logout" component={Logout} />
                <Route
                  exact
                  path="/login"
                  render={props => {
                    return <Login setCurrentUser={this.setCurrentUser} {...props} />;
                  }}
                />
                <AuthenticatedRoute
                  exact
                  path="/songs"
                  authenticated={this.state.authenticated}
                  component={SongList}
                  songs={this.state.songs}
                />
                <Route
                  path="/songs/:songId"
                  render={props => {
                    const song = this.state.songs[props.match.params.songId];
                    return song ? (
                      <ChordEditor song={song} updateSong={this.updateSong} />
                    ) : (
                      <h1>Song {props.match.params.songId} not found</h1>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </BrowserRouter>
        <Footer />
      </div>
    );
  }
}

export default App;
