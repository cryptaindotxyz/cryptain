import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.span`
  color: var(--terminal-green);
  text-decoration: none;
  font-size: 1.5rem;
  text-transform: lowercase;
  cursor: pointer;
  opacity: 1;

  &:hover {
    opacity: 0.8;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavLink = styled(Link)`
  color: var(--terminal-green);
  text-decoration: none;
  font-size: 1.2rem;

  &:hover {
    text-decoration: underline;
  }
`;

export default function Navigation() {
  return (
    <Nav>
      <Logo onClick={() => window.location.href = 'https://cryptain.xyz'}>
        cryptain
      </Logo>
      <NavLinks>
        <NavLink to="/log">/log</NavLink>
        <NavLink to="/stake">/stake</NavLink>
        <NavLink to="/vote">/vote</NavLink>
      </NavLinks>
    </Nav>
  );
}