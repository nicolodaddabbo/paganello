import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import PoolsPage from './pages/PoolsPage';
import NowPage from './pages/NowPage';
import MorePage from './pages/MorePage';
import SOTGPage from './pages/SOTGPage';

const base = import.meta.env.BASE_URL;
const basename = base.length > 1 ? base.replace(/\/$/, '') : undefined;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="schedule" element={<Navigate to="/" replace />} />
          <Route path="match/:matchId" element={<MatchPage />} />
          <Route path="pools" element={<PoolsPage />} />
          <Route path="live" element={<NowPage />} />
          <Route path="more" element={<MorePage />} />
          <Route path="sotg" element={<SOTGPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
