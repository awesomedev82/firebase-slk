import React from 'react';

const SignInButton = ({ onClick }) => {
  return <button onClick={onClick}>Sign in with Google</button>;
};

const WelcomePage = ({ onRefreshTokenClick, onFetchEmailsClick, onScrapeArticlesClick, onSendLeadsClick, onSignOutClick }) => {
  return (
    <>
      <h1>Seek Link</h1>
      <button className="centered-button" onClick={onFetchEmailsClick}>Fetch Emails</button>
      <br />
      <button className="centered-button" onClick={onScrapeArticlesClick}>Scrape Articles</button>
      <br />
      <button className="centered-button" onClick={onSendLeadsClick}>Send Emails</button>
      <br />
      <br />
      <button className="centered-button" onClick={onRefreshTokenClick}>Refresh Token</button>
      <br />
      <button className="centered-button" onClick={onSignOutClick}>Log Out</button>
    </>
  );
};

export { SignInButton, WelcomePage };