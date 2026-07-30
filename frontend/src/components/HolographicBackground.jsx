import { useEffect, useState } from 'react';

export default function HolographicBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse position between -25 and 25 pixels for subtle movement
      const x = (e.clientX / window.innerWidth - 0.5) * 25;
      const y = (e.clientY / window.innerHeight - 0.5) * 25;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ 
        zIndex: 0, 
        background: 'radial-gradient(circle at 50% 50%, #020813 0%, #000003 100%)' 
      }}
    >
      {/* Sleek High-Tech CSS Grid */}
      <div 
        className="absolute inset-[-40px] opacity-[0.08] transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Cybernetic Dot Matrix grid overlay */}
      <div 
        className="absolute inset-[-20px] opacity-[0.04] transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          backgroundImage: 'radial-gradient(rgba(0, 212, 255, 0.6) 1px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Ambient Gradient Glows (Pulsing & Moving) */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-[0.07] animate-pulse transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, var(--color-jarvis-cyan) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
          transform: `translate(${mousePos.x * -0.8}px, ${mousePos.y * -0.8}px)`,
          animationDuration: '8s',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full filter blur-[100px] opacity-[0.06] animate-pulse transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, var(--color-jarvis-purple) 0%, transparent 70%)',
          bottom: '15%',
          right: '15%',
          transform: `translate(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px)`,
          animationDuration: '6s',
        }}
      />

      {/* Bottom Horizon Glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[1px] opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--color-jarvis-cyan), transparent)',
          boxShadow: '0 0 20px 2px var(--color-jarvis-cyan)',
        }}
      />
    </div>
  );
}
