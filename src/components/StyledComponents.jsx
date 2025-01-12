import styled from 'styled-components';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
`;

export const Input = styled.input`
  background: transparent;
  border: 2px solid var(--terminal-green);
  color: var(--terminal-green);
  padding: 0.5rem;
  font-family: var(--terminal-font);
  font-size: 1rem;
  width: 100%;

  &:focus {
    outline: none;
    box-shadow: 0 0 5px var(--terminal-green);
  }
`;

export const Button = styled.button`
  background: transparent;
  border: 2px solid var(--terminal-green);
  color: var(--terminal-green);
  padding: 0.5rem 1rem;
  font-family: var(--terminal-font);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--terminal-green);
    color: var(--terminal-bg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const WalletInfo = styled.div`
  margin-bottom: 1rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

export const DisconnectButton = styled.button`
  background: none;
  border: none;
  color: var(--terminal-green);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
`;

export const StakedAmount = styled.div`
  text-align: center;
  margin: 1rem 0;
  opacity: 0.8;
`;

export const Status = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: var(--terminal-green);
`;

export const Error = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: #ff0000;
`;