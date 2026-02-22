"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  intensity?: number; // 0.6–1.4
  speed?: number;     // 0.2–1.2
  opacity?: number;   // 0.15–0.55
};

export default function SmokeBackground({
  className,
  intensity = 1.0,
  speed = 0.55,
  opacity = 0.28,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // ✅ IMPORTANT: force the context type to WebGLRenderingContext | null
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
    }) as WebGLRenderingContext | null;

    if (!gl) return;

    const vert = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main(){
        vUv = aPos * 0.5 + 0.5;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;

    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 uRes;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSpeed;
      uniform float uOpacity;

      float hash(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for(int i=0;i<5;i++){
          v += a * noise(p);
          p = m * p;
          a *= 0.55;
        }
        return v;
      }

      void main(){
        vec2 uv = vUv;
        vec2 p = (uv - 0.5) * vec2(uRes.x/uRes.y, 1.0);

        float t = uTime * uSpeed;

        float n1 = fbm(p * 2.2 + vec2(0.0, t * 0.6));
        float n2 = fbm(p * 3.4 + vec2(t * 0.35, 0.0));
        float n = mix(n1, n2, 0.55);

        float smoke = smoothstep(0.25, 0.85, n) * uIntensity;

        vec3 c1 = vec3(0.13, 0.83, 0.93); // cyan
        vec3 c2 = vec3(0.54, 0.36, 0.98); // purple
        vec3 c3 = vec3(0.98, 0.56, 0.22); // orange accent

        float mixA = smoothstep(-0.6, 0.6, p.x + 0.25*sin(t*0.35));
        float mixB = smoothstep(-0.7, 0.7, p.y + 0.25*cos(t*0.25));

        vec3 col = mix(c1, c2, mixA);
        col = mix(col, c3, 0.18 * mixB);

        float r = length(p);
        float vign = smoothstep(1.05, 0.25, r);

        float a = smoke * vign * uOpacity;
        gl_FragColor = vec4(col * a, a);
      }
    `;

    // ✅ Type-safe shader compiler
    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    if (!buf) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1,  1, -1, -1,  1,  -1,  1,  1, -1,  1,  1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uIntensity = gl.getUniformLocation(prog, "uIntensity");
    const uSpeed = gl.getUniformLocation(prog, "uSpeed");
    const uOpacity = gl.getUniformLocation(prog, "uOpacity");

    // If any uniform is missing, bail cleanly
    if (!uRes || !uTime || !uIntensity || !uSpeed || !uOpacity) {
      console.error("Uniform(s) missing — shader did not compile as expected.");
      return;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    // Pause when not visible
    let running = true;
    const io = new IntersectionObserver(
      (entries) => {
        running = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    let raf = 0;
    const start = performance.now();

    const render = () => {
      resize();

      if (running) {
        const t = (performance.now() - start) / 1000;
        gl.uniform1f(uTime, t);
        gl.uniform1f(uIntensity, intensity);
        gl.uniform1f(uSpeed, speed);
        gl.uniform1f(uOpacity, opacity);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      raf = requestAnimationFrame(render);
    };

    render();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();

      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [intensity, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
