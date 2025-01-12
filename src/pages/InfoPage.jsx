import React from 'react';
import styled from 'styled-components';
import { TerminalContainer } from '../components/Terminal';
import StakedAmount from '../components/info/StakedAmount';
import HowItWorks from '../components/info/HowItWorks';
import DocsLink from '../components/info/DocsLink';

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 2rem;
`;

const Title = styled.h1`
  margin: 0;
`;

export default function InfoPage() {
  return (
    <TerminalContainer>
      <Title data-header>Information</Title>
      <ContentContainer>
        <StakedAmount />
        <HowItWorks />
        <DocsLink />
      </ContentContainer>
    </TerminalContainer>
  );
}