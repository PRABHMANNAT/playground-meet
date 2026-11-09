'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowUpRight, AudioLines, Lightbulb, MousePointer2, Sparkles } from 'lucide-react';
export function HeroArt() {
  const x = useMotionValue(0),
    y = useMotionValue(0),
    sx = useSpring(x),
    sy = useSpring(y);
  const rx = useTransform(sy, [-1, 1], [3, -3]),
    ry = useTransform(sx, [-1, 1], [-3, 3]);
  return (
    <div
      className="hero-art"
      aria-label="An illustrated space for collaborative ideas"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width) * 2 - 1);
        y.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <div className="art-grid" />
      <div className="orbital orbital-one" />
      <div className="orbital orbital-two" />
      <motion.div className="world-window" style={{ rotateX: rx, rotateY: ry }}>
        <div className="window-top">
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>ROOM FOR POSSIBILITY</span>
          <ArrowUpRight size={14} />
        </div>
        <div className="landscape-window">
          <img src="/brand/landscape.png" alt="Playground’s pixel-art landscape" />
          <div className="landscape-overlay" />
          <div className="art-title">
            A little space.
            <br />A big <em>what if.</em>
          </div>
          <div className="art-caption">
            <span className="pulse-dot" /> Made for human connection
          </div>
        </div>
        <div className="window-bottom">
          <div className="sound-bars">
            {Array.from({ length: 15 }, (_, i) => (
              <i key={i} style={{ height: 8 + ((i * 7) % 21), animationDelay: `${i * 0.09}s` }} />
            ))}
          </div>
          <span>LESS FRICTION. MORE FLOW.</span>
          <AudioLines size={18} />
        </div>
      </motion.div>
      <motion.div
        className="floating-note note-idea"
        animate={{ y: [0, -8, 0], rotate: [-7, -5, -7] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span>
          <Lightbulb size={16} /> THE NEXT BIG THING
        </span>
        <strong>
          Starts with
          <br />
          “what if?”
        </strong>
        <div className="note-scribble">↗</div>
      </motion.div>
      <motion.div
        className="floating-note note-feedback"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="feedback-icon">
          <Sparkles size={16} />
        </span>
        <div>
          <strong>Good feedback. Great products.</strong>
          <small>Built for your next breakthrough.</small>
        </div>
      </motion.div>
      <div className="art-cursor">
        <MousePointer2 size={23} fill="currentColor" />
        <span>Your next idea</span>
      </div>
      <span className="art-coordinate">PG / MEET — 001</span>
      <span className="art-plus plus-one">+</span>
      <span className="art-plus plus-two">+</span>
    </div>
  );
}
