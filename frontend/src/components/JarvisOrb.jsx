import { motion } from 'motion/react';

export default function JarvisOrb({ isActive = false }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* HUD Container */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Rotating Ring (Dashed/Notched) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed opacity-30"
          style={{
            borderColor: 'var(--color-jarvis-cyan)',
            boxShadow: '0 0 15px rgba(0, 212, 255, 0.1), inset 0 0 15px rgba(0, 212, 255, 0.1)',
          }}
        />

        {/* Middle Counter-Rotating Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border border-double opacity-45"
          style={{
            borderColor: 'var(--color-jarvis-purple)',
            borderWidth: '3px',
            borderStyle: 'double',
          }}
        />

        {/* Thin Spinning Tech Details Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-8 rounded-full border border-dashed opacity-20"
          style={{
            borderColor: 'var(--color-jarvis-cyan)',
          }}
        />

        {/* Central Pulsing Core */}
        <motion.div
          animate={{
            scale: isActive ? [1, 1.1, 1] : [1, 1.04, 1],
            boxShadow: isActive 
              ? [
                  '0 0 25px rgba(0, 212, 255, 0.6), inset 0 0 15px rgba(0, 212, 255, 0.3)',
                  '0 0 45px rgba(0, 212, 255, 0.8), inset 0 0 25px rgba(0, 212, 255, 0.5)',
                  '0 0 25px rgba(0, 212, 255, 0.6), inset 0 0 15px rgba(0, 212, 255, 0.3)'
                ]
              : [
                  '0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 10px rgba(0, 212, 255, 0.2)',
                  '0 0 30px rgba(0, 212, 255, 0.5), inset 0 0 15px rgba(0, 212, 255, 0.3)',
                  '0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 10px rgba(0, 212, 255, 0.2)'
                ]
          }}
          transition={{
            duration: isActive ? 1.5 : 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, rgba(123, 47, 255, 0.05) 70%, transparent 100%)',
            border: '2px solid rgba(0, 212, 255, 0.5)',
          }}
        >
          {/* Internal HUD Elements */}
          <div className="text-[10px] tracking-[0.2em] font-semibold text-center mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            {isActive ? 'ACTIVE' : 'STANDBY'}
          </div>
          <div className="text-[8px] opacity-45 tracking-widest mt-0.5">
            {isActive ? 'SYS.OK' : 'SYS.STBY'}
          </div>
        </motion.div>

        {/* Small Outer HUD Labels */}
        <div 
          className="absolute text-[7px] tracking-widest opacity-35" 
          style={{ fontFamily: 'var(--font-heading)', top: '-10px', color: 'var(--color-text-secondary)' }}
        >
          SYS.LOC.001 // AI.DRV
        </div>
        <div 
          className="absolute text-[7px] tracking-widest opacity-35" 
          style={{ fontFamily: 'var(--font-heading)', bottom: '-10px', color: 'var(--color-text-secondary)' }}
        >
          CORE.ONLINE // 99.8%
        </div>
      </div>

      {/* Voice/Audio Equalizer Bars */}
      <div className="flex items-end justify-center gap-[3px] h-6 mt-6">
        {bars.map((i) => (
          <div
            key={i}
            className={`voice-bar ${isActive ? 'active' : ''}`}
            style={{
              animationDelay: `${i * 0.04}s`,
              animationDuration: `${0.35 + Math.random() * 0.45}s`,
              opacity: isActive ? 0.95 : 0.25,
              height: isActive ? '20px' : '4px',
              transition: 'height 0.3s, opacity 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
