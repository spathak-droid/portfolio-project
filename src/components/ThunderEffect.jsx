import { useEffect, useState } from 'react';

function ThunderEffect() {
  const [flash, setFlash] = useState(0);

  // Random thunder flashes
  useEffect(() => {
    const flashInterval = setInterval(() => {
      const delay = 10000 + Math.random() * 20000; // 10-30 seconds between flashes
      setTimeout(() => {
        setFlash(1);
        setTimeout(() => setFlash(0), 100); // Quick flash
        setTimeout(() => {
          setFlash(0.7);
          setTimeout(() => setFlash(0), 150); // Second flash
        }, 200);
      }, delay);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(flashInterval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: `rgba(255, 255, 255, ${flash})`,
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'background-color 0.1s ease-out'
      }}
    />
  );
}

export default ThunderEffect;