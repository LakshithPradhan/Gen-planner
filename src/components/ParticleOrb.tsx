import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  baseAlpha: number;
}

export const ParticleOrb: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const onResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', onResize);

    // Generate spherical particles
    const particleCount = 140;
    const sphereRadius = Math.min(width, height) * 0.35;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      particles.push({
        x: sphereRadius * Math.sin(theta) * Math.cos(phi),
        y: sphereRadius * Math.sin(theta) * Math.sin(phi),
        z: sphereRadius * Math.cos(theta),
        radius: Math.random() * 1.8 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.4,
      });
    }

    let angleX = 0.002;
    let angleY = 0.003;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left - width / 2) / width;
      const ny = (e.clientY - rect.top - height / 2) / height;
      mouseX = nx * 0.008;
      mouseY = ny * 0.008;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Soft ambient background radial glow
      const radial = ctx.createRadialGradient(cx, cy, 10, cx, cy, sphereRadius * 1.5);
      radial.addColorStop(0, 'rgba(0, 102, 255, 0.16)');
      radial.addColorStop(0.5, 'rgba(0, 102, 255, 0.04)');
      radial.addColorStop(1, 'rgba(8, 8, 10, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      const rotX = angleX + mouseY;
      const rotY = angleY + mouseX;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Sort by z for correct depth layering
      particles.sort((a, b) => b.z - a.z);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 3D rotation around Y and X axis
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        p.x = x1;
        p.y = y2;
        p.z = z2;

        // Perspective projection
        const fov = 400;
        const scale = fov / (fov + z2);
        const projX = cx + x1 * scale;
        const projY = cy + y2 * scale;
        const alpha = Math.max(0.1, Math.min(1, ((z2 + sphereRadius) / (sphereRadius * 2)) * p.baseAlpha));

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.5, p.radius * scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 130, 255, ${alpha})`;
        ctx.shadowBlur = z2 > 0 ? 12 : 2;
        ctx.shadowColor = '#0066ff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw subtle orbital rings
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Date.now() * 0.0003);
      ctx.beginPath();
      ctx.ellipse(0, 0, sphereRadius * 1.15, sphereRadius * 0.45, Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 102, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
      aria-hidden="true"
    />
  );
};
