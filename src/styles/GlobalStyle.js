import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --terminal-green: #00ff00;
    --terminal-bg: #000000;
    --terminal-font: 'VT323', monospace;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    background-color: var(--terminal-bg);
    color: var(--terminal-green);
    font-family: var(--terminal-font);
    line-height: 1.4;
    overflow: hidden;
  }
`