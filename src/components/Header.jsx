import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { Maximize, Minimize } from 'lucide-react';

dayjs.locale('zh-cn');

const Header = ({ isFullscreen, toggleFullscreen }) => {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex items-center justify-center h-16 mb-2 border-b border-white/5 bg-gradient-to-r from-transparent via-blue-900/10 to-transparent">
        {/* Decorative Background - optional gradient or image */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        <h1 className="text-4xl font-bold text-center tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-[0_0_15px_rgba(0,140,255,0.6)] font-[Rajdhani]">
            巴兹汽车 支架生产系统信息看板
        </h1>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <span className="text-lg text-cyan-400 font-mono drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
                {time.format('YYYY年MM月DD日 dddd HH:mm:ss')}
            </span>
            <button 
                onClick={toggleFullscreen} 
                className="p-2 hover:bg-cyan-500/20 rounded-full transition-all text-cyan-400 hover:text-cyan-200 hover:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
            >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
        </div>
    </div>
  );
};

export default Header;
