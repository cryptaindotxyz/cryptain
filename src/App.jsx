import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LogPage from './pages/LogPage';
import AdvancedLogPage from './pages/AdvancedLogPage';
import InfoPage from './pages/InfoPage';
import TokenPage from './pages/TokenPage';
import VotePage from './pages/VotePage';
import PortfolioPage from './pages/PortfolioPage';

const AppContainer = styled.div`
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  max-width: 600px;
  margin: 0 auto;
`;

const MainContent = styled.main`
  flex: 1;
  min-height: 0;
`;

export default function App() {
  return (
    <AppContainer>
      <Navigation />
      <MainContent>
        <Routes>
          <Route path="/" element={<Navigate to="/log" replace />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/advanced" element={<AdvancedLogPage />} />
          <Route path="/info" element={<InfoPage />} />
          <Route path="/stake" element={<TokenPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </MainContent>
      <Footer />
    </AppContainer>
  );
}