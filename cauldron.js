// "Cauldron" shader by @XorDev, ported to WebGL2 as a desktop-only background
// band along the bottom of the home page.
(function () {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var canvas = document.getElementById('cauldron');
    if (!canvas) return;
    var gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
    if (!gl) return;

    var vs = '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    var fs = [
        '#version 300 es',
        'precision highp float;',
        'uniform vec3 R;uniform float T;out vec4 O;',
        '// W < 1 stretches the flame horizontally.',
        'const float W=.55;',
        'void main(){',
        '  vec2 C=gl_FragCoord.xy;',
        '  float z=0.,d;O=vec4(0);',
        '  for(int i=0;i<40;i++){',
        '    vec3 p=z*normalize(vec3((2.*C.x-R.x)*W,2.*C.y-R.y,-R.z));',
        '    p.zy+=3.;d=2.;',
        '    for(int j=0;j<7;j++){d/=.8;p+=.6*p.y*cos(p.yzx*d-vec3(T,0,0)*6.)/d;}',
        '    z+=d=.02+abs(length(p.xz)+p.y*.4-1.)/9.;',
        '    O+=(sin(vec4(5,0,2,0)-p.y)+2.)/d;',
        '  }',
        '  O=tanh(O*O/15e5);O.a=1.;',
        '}'
    ].join('\n');

    function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }
    var prog = gl.createProgram();
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(prog, 'R');
    var uT = gl.getUniformLocation(prog, 'T');

    // Render at half resolution; the raymarch is heavy and the CSS upscale is invisible.
    var SCALE = 0.5;
    function resize() {
        var w = Math.floor(canvas.clientWidth * SCALE), h = Math.floor(canvas.clientHeight * SCALE);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w; canvas.height = h;
            gl.viewport(0, 0, w, h);
        }
    }
    window.addEventListener('resize', resize);

    var start = performance.now();
    function frame() {
        resize();
        gl.uniform3f(uR, canvas.width, canvas.height, canvas.height);
        gl.uniform1f(uT, (performance.now() - start) / 1000 * 0.35); // slowed down
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(frame);
    }
    frame();
})();
