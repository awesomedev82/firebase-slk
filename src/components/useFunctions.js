import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import { firebaseConfig } from '../config/firebaseConfig';
import { showToast } from '../utils/toastUtils';

firebase.initializeApp(firebaseConfig);

const useFunctions = () => {

  const fetchEmails = (access_token, userUid) => {
    if (access_token && userUid) {
      const fetchEmailsFunction = firebase.functions().httpsCallable('fetchEmails');
      return fetchEmailsFunction({ access_token, userUid })
        .then((result) => {
          console.log('Result', result);
          showToast(result.data.message, 'success');
          return result;
        })
        .catch((error) => {
          console.error('Error:', error);
          showToast(error.data.message, 'error');
          throw error;
        });
    } else {
      const error = 'Access token or user UID is missing. User may not be authenticated.';
      showToast(error, 'error');
      console.error(error);
      return Promise.reject(new Error('Access token or user UID is missing'));
    }
  };

  const scrapeArticles = (userUid) => {
    if (userUid) { 
      const scrapeArticlesFunction = firebase.functions().httpsCallable('scrapeArticles');
      return scrapeArticlesFunction({ userUid })
      .then((result) => {
        console.log('Result', result);
        showToast(result.data.message, 'success');
        return result;
      })
      .catch((error) => {
        console.error('Error:', error);
        showToast(error.data.message, 'error');
        throw error;
      });
    } else {
      const error = 'User UID is missing. User may not be authenticated.'
      showToast(error, 'error');
      console.error(error);
      return Promise.reject(new Error(error));
    }
  };

  const sendLeads = (access_token, userUid) => {
    if (userUid && access_token) {
      const sendLeadsFunction = firebase.functions().httpsCallable('sendLeads');
      return sendLeadsFunction({ userUid, access_token })
      .then((result) => {
        console.log('Result', result);
        showToast(result.data.message, 'success');
        return result;
      })
      .catch((error) => {
        console.error('Error:', error);
        showToast(error.data.message, 'error');
        throw error;
      });
    } else {
      const error = 'User UID or authorization code is missing. User may not be authenticated.'
      showToast(error, 'error');
      console.error(error);
      return Promise.reject(new Error(error));
    }
  };

  return { fetchEmails, scrapeArticles, sendLeads };
};

export default useFunctions;