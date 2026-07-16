import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store/store';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Explorer from './pages/Explorer';
import WorldDetail from './pages/WorldDetail';
import Directory from './pages/Directory';
import AgentDetail from './pages/AgentDetail';
import Connections from './pages/Connections';
import Consents from './pages/Consents';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/worlds" element={<Explorer />} />
            <Route path="/worlds/:worldId" element={<WorldDetail />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/agents/:agentId" element={<AgentDetail />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/consents" element={<Consents />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </StoreProvider>
  );
}
