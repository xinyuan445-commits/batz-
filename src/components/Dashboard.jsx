import React, { useState, useEffect } from 'react';
import Header from './Header';
import KPIGauges from './KPIGauges';
import InjectionModule from './InjectionModule';
import QualityModule from './QualityModule';
import AssemblyModule from './AssemblyModule';

const Dashboard = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change events (e.g. user presses Esc)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check system lock status periodically
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? `http://${window.location.hostname}:3001` 
            : '';
        // Any API call can be used to check the status. If it returns 403 with SYSTEM_LOCKED, we lock the screen.
        const response = await fetch(`${baseUrl}/api/health`);
        
        // Fetch does not throw on HTTP error statuses (like 403), it just resolves.
        if (!response.ok) {
            if (response.status === 403) {
                const data = await response.json().catch(() => ({}));
                if (data.error === 'SYSTEM_LOCKED') {
                    setIsSystemLocked(true);
                    return;
                }
            }
        } else {
            setIsSystemLocked(false);
        }
      } catch (err) {
        // Only lock if we explicitly get the SYSTEM_LOCKED 403 error from our backend
        // General network errors shouldn't necessarily trigger the lock screen unless desired
      }
    };

    // Fast initial check
    checkSystemStatus();
    // Then check every 3 seconds to be responsive
    const interval = setInterval(checkSystemStatus, 3000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 h-full flex flex-col gap-4 bg-dashboard-bg bg-tech-pattern text-white overflow-hidden font-sans relative">
        {isSystemLocked && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="text-center p-8 border border-red-500/30 rounded-lg bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <h1 className="text-4xl font-bold text-red-500 mb-4 tracking-wider">请检查网络</h1>
                    <p className="text-gray-400 text-lg">无法连接到服务器或授权验证失败</p>
                </div>
            </div>
        )}

        <Header isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
        
        <div className="flex-1 flex flex-col gap-4 min-h-0 animate-fade-in">
            {/* Top KPIs - Full Width */}
            <div className="h-[15%] min-h-[120px]">
                <KPIGauges />
            </div>

            {/* Main Content - Split Columns */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Column - Injection & Quality */}
                <div className="w-[40%] flex flex-col gap-4">
                    <div className="flex-1">
                        <InjectionModule />
                    </div>
                    <div className="flex-1">
                        <QualityModule />
                    </div>
                </div>

                {/* Right Column - Assembly */}
                <div className="w-[60%] h-full">
                    <AssemblyModule />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
