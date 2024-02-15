import type { Options } from "./dialog";
import { error } from "./utils";
import erpToCubeFrag from './shaders/erpToCube.frag';
import erpToCubeVert from './shaders/erpToCube.vert';

type Ctx = { gl: WebGLRenderingContext, opts: Options };

function createContext(opts: Options): Ctx {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = length;

    const gl = canvas.getContext('webgl');
    if (!gl) throw error('WebGL failed to load');
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    return {
        gl,
        opts
    };
}

function createShader(ctx: Ctx, shaderType: number, src: string) {
    const { gl } = ctx;
    const shader = gl.createShader(shaderType);
    if (!shader) throw error('WebGL Shader failed to be created')
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw error('Shader failed to compile');
    return shader;
}

function createProgram(ctx: Ctx, vertSrc: string, fragSrc: string) {
    const { gl } = ctx;
    const program = gl.createProgram();
    if (!program) throw error("WebGL program failed to be created")
    const vertShader = createShader(ctx, gl.VERTEX_SHADER, vertSrc);
    const fragShader = createShader(ctx, gl.VERTEX_SHADER, fragSrc);
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    return program;
}

function useProgram({ gl }: Ctx, prog: WebGLProgram) {
    gl.useProgram(prog);

    const cornerVertices = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, cornerVertices, gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(prog, 'position');
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribLocation);
}

function loadEquirectangular(ctx: Ctx) {
    const { gl, opts: { texture: src, } } = ctx;

    const img = loadImg(src);
    if (!img) return loadCube(ctx);

    const program = createProgram(ctx, erpToCubeVert, erpToCubeFrag);
    useProgram(ctx, program);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const texture = createEquirectangular2dTexture(ctx, img);
    const cubemap = createCubeMap(ctx);
    const fbo = createFrameBuffer(gl, program, cubemap);

    //unbind framebuffer and delete objects
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
}

function defaultTex({ gl }: Ctx, type: number) {
    const smoothing = gl.LINEAR;
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, smoothing);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, smoothing);
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function loadImg(src?: string): TexImageSource | null {
    if (!src) return null;
    return null;
}

function createEquirectangular2dTexture(ctx: Ctx, img: TexImageSource) {
    const { gl } = ctx;
    const texture = gl.createTexture();
    if (!texture) throw error("Texture could not be created");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    defaultTex(ctx, gl.TEXTURE_2D);
    return texture;
}

function createCubeMap(ctx: Ctx) {
    const { gl, opts: { textureLength } } = ctx;
    const cubemap = gl.createTexture();
    if (!cubemap) throw error("Cubemap texture could not be created")
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    defaultTex(ctx, gl.TEXTURE_CUBE_MAP);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            gl.RGBA,
            textureLength,
            textureLength,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        )
    };
    return cubemap;
}

function createFrameBuffer(gl: WebGLRenderingContext, prog: WebGLProgram, cubemap: WebGLTexture) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const faceLocation = gl.getUniformLocation(prog, 'face');
    for (let i = 0; i < 6; i++) {
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            cubemap,
            0
        );
        gl.uniform1i(faceLocation, i);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return fbo;
}

function rotate(canvas: HTMLCanvasElement, image: CanvasImageSource, quarters: number) {
    const ctx = canvas.getContext('2d');
    const angle = Math.PI * quarters / 2;
    const { width } = canvas;
    if (!ctx) throw error("2D Canvas Context could not be created");
    ctx.restore();
    ctx.save();
    ctx.translate(width / 2, width / 2);
    ctx.rotate(angle);
    ctx.translate(-width / 2, -width / 2);
    if (image) {
        ctx.drawImage(image, 0, 0, width, width);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, width);
        ctx.fillStyle = 'magenta';
        ctx.fillRect(0, 0, width / 2, width / 2);
        ctx.fillRect(width / 2, width / 2, width, width);
    }
    return canvas;
};

const sideRotations = {
    north: -1,
    south: 1,
    west: 2,
    east: 0,
    top: -1,
    bottom: -1
} as const;
type Sides = keyof typeof sideRotations;

function loadFace([side, rotation]: [string, number], i: number) {
    const sideRotations = {
        north: -1,
        south: 1,
        west: 2,
        east: 0,
        top: -1,
        bottom: -1
    };


}

function loadCube(ctx: Ctx) {
    //resize images to the same length and correct face rotation
    const { gl, opts } = ctx;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = opts.textureLength;
    // for (const [i, [side, rot]] of Object.entries(sideRotations).entries()) {
    //     const texture = opts[side as Sides];
    //     gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA,
    //         gl.UNSIGNED_BYTE, rotate(canvas, north, -1));
    // }
    Object.entries(sideRotations).map(loadFace, ctx);

    //create cubemap texture and store faces to it
    const cubemap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    defaultTex(ctx, gl.TEXTURE_CUBE_MAP);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, rotate(canvas, north, -1));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, rotate(canvas, south, 1));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, rotate(canvas, west, 2));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, rotate(canvas, east, 0));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, rotate(canvas, up, -1));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, rotate(canvas, down, -1));
}

function renderSphereSides(ctx: Ctx) {

}

function generate(opts: Options) {

}