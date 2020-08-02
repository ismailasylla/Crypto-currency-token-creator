import React from 'react';
import logo from '../images/logo/logoblue.png';

function Home() {
  return (
    <div>
      <img className="logo logohover m-5" src={logo} alt="Logo" />
      <h1>Welcome to AlphaSeed </h1>
    </div>
  );
}

export default Home;
