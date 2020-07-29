import React from 'react';
import logo from '../images/logo/logo.png';
import { Link } from 'react-router-dom';
function NavBar() {
  return (
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <Link class="navbar-brand" to="/">
        {/* <img className="logoNav" src={logo} alt="Logo" /> */}
        AlphaSeed
      </Link>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarColor02"
        aria-controls="navbarColor02"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarColor02">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <Link class="nav-link" to="createtoken">
              <i class="fas fa-coins">
                <span className="m-1">Create Token</span>
              </i>
            </Link>
          </li>
          <li class="nav-item">
            <Link class="nav-link" to="createsymbol">
              <i class="fas fa-coins">
                <span className="m-1">Create Symbol</span>
              </i>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
