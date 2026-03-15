import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SchedulePage from './pages/SchedulePage';
import PoolsPage from './pages/PoolsPage';
import SOTGPage from './pages/SOTGPage';

export default function App() {
  return (
    <BrowserRouter basename="/paganello">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SchedulePage />} />
          <Route path="pools" element={<PoolsPage />} />
          <Route path="sotg" element={<SOTGPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
