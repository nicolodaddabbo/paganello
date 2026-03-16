import { Outlet } from 'react-router-dom';
import TopBar from './common/TopBar';
import BottomNav from './common/BottomNav';

export default function Layout() {
  return (
    <div className="app-layout">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
