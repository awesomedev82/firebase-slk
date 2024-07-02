import { useState, useEffect } from 'react';
import { loadGapiInsideDOM } from 'gapi-script';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/functions';
import { firebaseConfig } from '../config/firebaseConfig';

export const useAuth = () => {
  const [gapi, setGapi] = useState(null);
  const [access_token, setAccess_token] = useState(null);
  const [userUid, setUserUid] = useState(null);

  useEffect(() => {
    const loadGapi = async () => {
      const newGapi = await loadGapiInsideDOM();
      setGapi(newGapi);
    }
    loadGapi();
  }, []);

  useEffect(() => {
    if (!gapi) return;

    const setAuth2 = async () => {

      gapi.load('auth2', () => {
        gapi.auth2.init({
          apiKey: firebaseConfig.apiKey,
          clientId: '291054540146-7nd4tp8jkk9dlou3u743p986ekmtb4go.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
        })
      });
    }
    setAuth2();
  }, [gapi]);

  const signInWithGoogle = () => {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signIn().then((googleUser) => {
      const id_token = googleUser.getAuthResponse().id_token;
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      firebase.auth().signInWithCredential(credential)
      .then((result) => {
        setUserUid(result.user.uid);
        refreshAccessToken();
        console.log('User signed in');
      }).catch((error) => {
        console.error('Error signing in:', error);
      });
    }).catch((error) => {
      console.error('Error signing in:', error);
    });
  
    const googleLoginUrl = 'https://accounts.google.com/o/oauth2/auth?' +
      'client_id=291054540146-7nd4tp8jkk9dlou3u743p986ekmtb4go.apps.googleusercontent.com' +
      '&redirect_uri=https://seek-link.firebaseapp.com/__/auth/handler' +
      '&response_type=code' +
      '&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify' +
      '&access_type=offline' +
      '&prompt=consent';
  
      window.open(googleLoginUrl, '_blank', 'noopener,noreferrer');
  }

  const refreshAccessToken = () => {
    gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse().then((res) => {
      setAccess_token(res.access_token);
      let cred = firebase.auth.GoogleAuthProvider.credential(null, res.access_token);
      firebase.auth().signInWithCredential(cred).then(function (res) {
        console.log("refreshtoken done");
        setUserUid(res.user.uid);
      })
    });
  };

  const signOutWithGoogle = () => {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
      setAccess_token(null);
      setUserUid(null);
      console.log('User signed out.');
    }).then(() => {
      firebase
        .auth()
        .signOut()
        .then(() => {
          console.log("firebase signout");
        })
        .catch((error) => {
          console.error(error.message);
        });
    });

  }

  return {
    gapi,
    access_token,
    userUid,
    signInWithGoogle,
    refreshAccessToken,
    signOutWithGoogle,
  };
};