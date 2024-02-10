import { showError } from "./utils";
import cubeToHemiFrag from './shaders/cubeToHemi.frag';
import cubeToHemiVert from './shaders/cubeToHemi.vert';
import erpToCubeFrag from './shaders/erpToCube.frag';
import erpToCubeVert from './shaders/erpToCube.vert';
import type { Options } from "./dialog";
import THREE from "three";

function createShader(gl: WebGLRenderingContext, shaderType: number, shaderSrc: string) {
    const shader = gl.createShader(shaderType);
    if (!shader) {
        showError("WebGL Shader could not be created");
    }

    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
    return shader;
}

function initProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string) {
    const program = gl.createProgram();
    if (!program) {
        showError("WebGL Program could not be created");
    }

    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragSrc));

    gl.linkProgram(program);
    return program;
}

function loadProgram(gl: WebGLRenderingContext, program: WebGLProgram) {
    gl.useProgram(program);

    const cornerVertices = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, cornerVertices, gl.STATIC_DRAW);
    this.draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const positionAttribLocation = gl.getAttribLocation(program, 'position');
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribLocation);
}

function setTexParameters(gl: WebGLRenderingContext, textureType: number, smoothing: boolean = true) {
    const param = smoothing ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

type Context = ReturnType<typeof initGL>;

function initGL(length: number, mapping: 'equirectangular' | 'cube') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = length;

    const gl = canvas.getContext('webgl');
    if (!gl) {
        showError('WebGL failed to load');
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    return {
        gl,
        canvas,
        length,
        mapping,
        smoothing: true,
    }
}

function createEquirectangular2dTexture(gl: WebGLRenderingContext, image: TexImageSource) {
    const texture = gl.createTexture();
    if (!texture) {
        showError("WebGL 2D Texture could not be created")
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    setTexParameters(gl, gl.TEXTURE_2D);
    return texture;
}

function createCubemap(gl: WebGLRenderingContext, length: number) {
    const cubemap = gl.createTexture();
    if (!cubemap) {
        showError("WebGL Cube map could not be created")
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    setTexParameters(gl, gl.TEXTURE_CUBE_MAP);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            0,
            gl.RGBA,
            length,
            length,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
    }
    return cubemap;
}

function renderFramebuffer(gl: WebGLRenderingContext, cubemap: WebGLTexture, prog: WebGLProgram) {
    const fbo = gl.createFramebuffer();
    if (!fbo) {
        showError("WebGL frame buffer could not be created")
    }
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

function loadEquirectangular({ gl, length }: Context, image: TexImageSource) {
    const prog = initProgram(gl, erpToCubeVert, erpToCubeFrag);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    loadProgram(gl, prog);

    const texture = createEquirectangular2dTexture(gl, image);
    const cubemap = createCubemap(gl, length);
    const fbo = renderFramebuffer(gl, cubemap, prog);

    //cleanup
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
}

function rescale(length: number,) {
    //resize images to the same length and correct face rotation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        showError("2D canvas context could not be created");
    }
    canvas.width = canvas.height = length;
    return (image: CanvasImageSource, theta: number) => {
        ctx.restore();
        ctx.save();
        ctx.translate(length / 2, length / 2);
        ctx.rotate(theta);
        ctx.translate(-length / 2, -length / 2);
        if (image) {
            ctx.drawImage(image, 0, 0, length, length);
        } else {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, length, length);
            ctx.fillStyle = 'magenta';
            ctx.fillRect(0, 0, length / 2, length / 2);
            ctx.fillRect(length / 2, length / 2, length, length);
        }
        return canvas;
    };
}

function loadFaces({ north, west, south, east, up, down }: { north: TexImageSource, west: TexImageSource, south: TexImageSource, east: TexImageSource, up: TexImageSource, down: TexImageSource }) {
    const rotate = rescale(length);
}

function generate({ origin, mapping, textureLength }: Options) {
    const center = new THREE.Vector3().fromArray(origin);
    Undo.initEdit({ outliner: true, selection: true });
    const group = new Group({
        name: 'sphere',
        origin
    }).init();

    const ctx = initGL(textureLength, mapping);

    if (mapping == 'equirectangular') {
    }

    const cubeToHemi = initProgram(gl, cubeToHemiVert, cubeToHemiFrag);



}