import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ScenicBackground() {
  const { activeTheme } = useApp();

  const themes = {
    'moon-walk': {
      type: 'video',
      src: '/backgrounds/moon-walk.mp4',
      poster: '/backgrounds/minimal.jpg',
      overlay: 'bg-black/25'
    },
    'purple-desert': {
      type: 'video',
      src: '/backgrounds/purple-desert.mp4',
      poster: '/backgrounds/mountains.jpg',
      overlay: 'bg-black/25'
    },
    mountains: {
      type: 'image',
      src: '/backgrounds/mountains.jpg',
      overlay: 'bg-black/15'
    },
    ocean: {
      type: 'image',
      src: '/backgrounds/ocean.jpg',
      overlay: 'bg-black/20'
    },
    sunset: {
      type: 'image',
      src: '/backgrounds/sunset.jpg',
      overlay: 'bg-black/20'
    },
    minimal: {
      type: 'image',
      src: '/backgrounds/minimal.jpg',
      overlay: 'bg-black/30'
    }
  };

  const current = themes[activeTheme] || themes.mountains;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {current.type === 'video' ? (
        <video
          key={current.src}
          autoPlay
          loop
          muted
          playsInline
          poster={current.poster || '/backgrounds/mountains.jpg'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        >
          <source src={current.src} type="video/mp4" />
        </video>
      ) : (
        <div
          key={current.src}
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
          style={{ backgroundImage: `url("${current.src}")` }}
        />
      )}

      {/* Light subtle tint so scenery is vividly visible while text stays crisp */}
      <div className={`absolute inset-0 ${current.overlay || 'bg-black/20'} backdrop-blur-[0.5px]`} />
    </div>
  );
}
