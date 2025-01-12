import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { TERMINAL_CONFIG } from '../config/terminal';

const FooterContainer = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem 0;
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 0.15rem;
`;

const IconLink = styled.a`
  color: var(--terminal-green);
  font-size: 1.5rem;
  opacity: 0.8;
  transition: opacity 0.2s;
  line-height: 1;

  &:hover {
    opacity: 1;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const InfoLink = styled(Link)`
  color: var(--terminal-green);
  text-decoration: none;
  opacity: 0.8;
  font-size: 0.9rem;
  transition: opacity 0.2s;
  line-height: 1;

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <SocialLinks>
        <IconLink href={TERMINAL_CONFIG.socials.twitter} target="_blank" rel="noopener noreferrer">
          <FaXTwitter />
        </IconLink>
        <IconLink href={TERMINAL_CONFIG.socials.telegram} target="_blank" rel="noopener noreferrer">
          <FaTelegram />
        </IconLink>
      </SocialLinks>
      <NavLinks>
        <InfoLink to="/info">/info</InfoLink>
        <InfoLink to="/portfolio">/portfolio</InfoLink>
      </NavLinks>
    </FooterContainer>
  );
}