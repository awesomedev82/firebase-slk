import React from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/functions';
import { useAuth } from './components/useAuth';
import { firebaseConfig } from './config/firebaseConfig';
import useFunctions from './components/useFunctions';
import { SignInButton, WelcomePage } from './pages/home';


firebase.initializeApp(firebaseConfig);


function App() {

  const {
    access_token,
    userUid,
    signInWithGoogle,
    refreshAccessToken,
    signOutWithGoogle,
  } = useAuth();

  const { fetchEmails, scrapeArticles, sendLeads } = useFunctions();

  const handleSignIn = () => {
    signInWithGoogle();
  }

  const handleSignOut = () => {
    signOutWithGoogle();
  }

  const handleRefreshToken = () => {
    refreshAccessToken();
  }

  const handleFetchEmails = () => {
    fetchEmails(access_token, userUid)
  };

  const handleScrapeArticles = () => {
    scrapeArticles(userUid)
  };

  const handleSendLeads = () => {
    sendLeads(access_token, userUid)
  };

  return (
    <div className="App">
      <header className="App-header">
        {!userUid ? (
          <SignInButton onClick={handleSignIn} />
        ) : (
          <WelcomePage
            onRefreshTokenClick={handleRefreshToken}
            onFetchEmailsClick={handleFetchEmails}
            onScrapeArticlesClick={handleScrapeArticles}
            onSendLeadsClick={handleSendLeads}
            onSignOutClick={handleSignOut}
          />
        )}
      </header>
    </div>
  );
}

export default App;