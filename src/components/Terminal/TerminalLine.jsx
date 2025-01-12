import styled from 'styled-components';

export const TerminalLine = styled.p`
  margin: 0.5rem 0;
  &::before {
    content: '>';
    margin-right: 0.5rem;
    opacity: 0.7;
  }
`;