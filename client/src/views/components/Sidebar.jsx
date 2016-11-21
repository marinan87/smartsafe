import React from 'react'
import {Link} from 'react-router'

const Sidebar = () => (
  <nav className="nav-group">
    <Link to="/" className="nav-group-item">
      <span className="icon icon-folder"></span>
      Files
    </Link>
    <Link to="/settings" className="nav-group-item">
      <span className="icon icon-cog"></span>
      Settings
    </Link>
  </nav>
)

export default Sidebar