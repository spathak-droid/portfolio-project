import { useEffect, useState } from 'react';

function ThunderEffect() {
  const [flash, setFlash] = useState(0);

  // Flash every second
  useEffect(() => {
    const flashInterval = setInterval(() => {
      // Quick flash sequence
      setFlash(0.8);
      setTimeout(() => {
        setFlash(0);
        setTimeout(() => {
          setFlash(0.5);
          setTimeout(() => setFlash(0), 100);
        }, 50);
      }, 100);
    }, 3000);

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