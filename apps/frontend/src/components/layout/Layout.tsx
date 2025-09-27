import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setIsMobile, setSidebarOpen } from '../../store/slices/uiSlice';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const dispatch = useDispatch();
  const { isMobile, sidebarOpen } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      dispatch(setIsMobile(mobile));
      
      // Auto-close sidebar on mobile when screen size changes
      if (mobile && sidebarOpen) {
        dispatch(setSidebarOpen(false));
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [dispatch, sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-auto mobile-safe-area">
            <div className="mobile-container py-4">
              {children}
            </div>
          </main>
          <MobileNav />
        </div>
      ) : (
        /* Desktop Layout */
        <div className="h-screen">
          <Sidebar />
          <div className="md:pl-64 flex flex-col h-full">
            <Header />
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
