import { Ctx, loadImg, createProgram, useProgram, defaultTex, SIDES } from "./common"
import { error } from "../utils"
import { loadCube } from "./cubemap"
import erpToCubeFrag from '../shaders/erpToCube.frag'
import erpToCubeVert from '../shaders/erpToCube.vert'

export async function loadEquirectangular(ctx: Ctx) {
    const {
        gl,
        opts: { texture: src },
    } = ctx

    const img = await loadImg(src)
    if (!img) {
        for (const side of SIDES) {
            ctx.opts[side] = undefined;
        }
        loadCube(ctx);
        return;
    }

    const program = createProgram(ctx, erpToCubeVert, erpToCubeFrag)
    useProgram(ctx, program)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    const texture = createEquirectangular2dTexture(ctx, img)
    const cubemap = createCubeMap(ctx)
    const fbo = createFrameBuffer(gl, program, cubemap)

    //unbind framebuffer and delete objects
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(fbo)
    gl.deleteTexture(texture)
}

function createEquirectangular2dTexture(ctx: Ctx, img: TexImageSource) {
    const { gl } = ctx
    const texture = gl.createTexture()
    if (!texture) throw error('Texture could not be created')
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    defaultTex(ctx, gl.TEXTURE_2D)
    return texture
}

function createCubeMap(ctx: Ctx) {
    const {
        gl,
        opts: { textureLength },
    } = ctx
    const cubemap = gl.createTexture()
    if (!cubemap) throw error('Cubemap texture could not be created')
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap)
    defaultTex(ctx, gl.TEXTURE_CUBE_MAP)
    for (let i = 0; i < SIDES.length; i++) {
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
    }
    return cubemap
}

function createFrameBuffer(
    gl: WebGLRenderingContext,
    prog: WebGLProgram,
    cubemap: WebGLTexture
) {
    const fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    const faceLocation = gl.getUniformLocation(prog, 'face')
    for (let i = 0; i < SIDES.length; i++) {
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            cubemap,
            0
        )
        gl.uniform1i(faceLocation, i)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    return fbo
}