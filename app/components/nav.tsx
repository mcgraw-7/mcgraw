
import Link from 'next/link';
import React from 'react';

const Nav = () => {
  return (
    <nav style={{ position: 'sticky', top: 20, zIndex: 1000 }}>
      <ul className="" style={{ listStyle: 'none', display: 'flex', justifyContent: 'space-around' }}>
        <li>
          <Link href="/">
            home
          </Link>
        </li>
        <li>
          <Link href="/work">
            work
          </Link>
        </li>
        <li>
          <Link href="/more">
            more
          </Link>
        </li>
        <li>
          <Link href="/automate">
            automate
          </Link>
        </li>
        <li>
          <Link href="https://github.com/mmcgraw73/mcgraw">
            <i className="fa-brands fa-github-alt"></i>
          </Link>
        </li>
        <li>
          <Link href="https://www.linkedin.com/in/mcgraw-profile/">
            <i className="fa-brands fa-linkedin"></i>
          </Link>
        </li>
        {/* Add more navigation links as needed */}
      </ul>
    </nav>
  );
};

export default Nav;
