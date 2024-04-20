import type { Options } from '../dialog';
import { error } from '../utils';

export interface Ctx {
    gl: WebGLRenderingContext;
    canvas: HTMLCanvasElement;
    opts: Options;
}
export const SIDES: CubeFaceDirection[] = [
    'north',
    'south',
    'west',
    'east',
    'up',
    'down',
];

export function createContext(opts: Options): Ctx {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = length;

    const gl = canvas.getContext('webgl');
    if (!gl) throw error('WebGL failed to load');
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    return {
        gl,
        canvas,
        opts,
    };
}

function createShader(ctx: Ctx, shaderType: number, src: string) {
    const { gl } = ctx;
    const shader = gl.createShader(shaderType);
    if (!shader) throw error('WebGL Shader failed to be created');
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw error(gl.getShaderInfoLog(shader) ?? 'Shader failed to compile');
    return shader;
}

export function createProgram(ctx: Ctx, vertSrc: string, fragSrc: string) {
    const { gl } = ctx;
    const program = gl.createProgram();
    if (!program) throw error('WebGL program failed to be created');
    const vertShader = createShader(ctx, gl.VERTEX_SHADER, vertSrc);
    const fragShader = createShader(ctx, gl.FRAGMENT_SHADER, fragSrc);
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    return program;
}

export function useProgram({ gl }: Ctx, prog: WebGLProgram) {
    gl.useProgram(prog);

    const cornerVertices = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, cornerVertices, gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(prog, 'position');
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribLocation);
}

export function defaultTex({ gl, opts: { smoothing } }: Ctx, type: number) {
    const filter = smoothing ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

export function loadImg(src?: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve, reject) => {
        if (!src) return void resolve(null);
        const image = new Image();
        image.onload = function () {
            resolve(image);
        };
        image.onerror = () => {
            reject(error(`Texture could not be loaded from file '${src}`));
        };
        image.src = src;
    });
}
