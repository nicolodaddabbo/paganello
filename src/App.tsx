import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import PoolsPage from './pages/PoolsPage';
import NowPage from './pages/NowPage';
import MorePage from './pages/MorePage';
import SOTGPage from './pages/SOTGPage';
import MapPage from './pages/MapPage';
import BracketPage from './pages/BracketPage';
import TeamPage from './pages/TeamPage';

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
          <Route path="map" element={<MapPage />} />
          <Route path="bracket" element={<BracketPage />} />
          <Route path="team/:teamName" element={<TeamPage />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900 }}>404</h1>
              <p style={{ color: '#999', margin: '1rem 0' }}>Page not found</p>
              <a href="/" style={{ color: '#009fe3', fontWeight: 600 }}>Back to schedule</a>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
