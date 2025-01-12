import React, { useState } from 'react';
import styled from 'styled-components';
import { FaRegCopy, FaCheck } from 'react-icons/fa';

const AddressContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const AddressText = styled.span`
  cursor: pointer;
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  color: var(--terminal-green);
`;

export function CopyableAddress({ children, fullAddress }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Use fullAddress prop if provided, otherwise use children with '> ' removed
      const textToCopy = fullAddress || children.toString().replace('> ', '');
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <AddressContainer onClick={handleCopy}>
      <AddressText>{children}</AddressText>
      <IconWrapper>
        {copied ? <FaCheck size={14} /> : <FaRegCopy size={14} />}
      </IconWrapper>
    </AddressContainer>
  );
}