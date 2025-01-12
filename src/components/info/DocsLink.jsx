import React from 'react';
import styled from 'styled-components';
import { FaExternalLinkAlt } from 'react-icons/fa';

const Link = styled.a`
  color: var(--terminal-green);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.8;

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;

export default function DocsLink() {
  return (
    <Link 
      href="https://docs.cryptain.xyz" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      Read the documentation <FaExternalLinkAlt size={12} />
    </Link>
  );
}