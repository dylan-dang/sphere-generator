import { error } from '../utils';
import { Ctx, defaultTex, SIDES, loadImg } from './common';

export async function loadCube(ctx: Ctx) {
    const { gl, opts } = ctx;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = opts.textureLength;

    const cubemap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
    defaultTex(ctx, gl.TEXTURE_CUBE_MAP);

    // correct rotation and output texture size
    const images = await Promise.all(
        SIDES.map((side) => opts[side]).map(loadImg)
    );

    images.forEach(renderFace, { canvas, ctx });
}

function renderFace(
    this: { canvas: HTMLCanvasElement; ctx: Ctx },
    image: CanvasImageSource | null,
    index: number
) {
    const {
        canvas,
        ctx: { gl },
    } = this;
    const { width } = canvas;

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw error('2D Canvas Context could not be created');

    ctx2d.save();
    // correct rotation
    rotateFace(ctx2d, width, (Math.PI * [-1, 1, 2, 0, -1, -1][index]) / 2);
    if (image) {
        ctx2d.drawImage(image, 0, 0, width, width);
    } else {
        drawMissingTexture(ctx2d, width);
    }
    gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + index,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        canvas
    );

    ctx2d.restore();
}

function rotateFace(
    ctx: CanvasRenderingContext2D,
    width: number,
    angle: number
) {
    ctx.translate(width / 2, width / 2);
    ctx.rotate(angle);
    ctx.translate(-width / 2, -width / 2);
}

function drawMissingTexture(ctx: CanvasRenderingContext2D, width: number) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, width);
    ctx.fillStyle = 'magenta';
    ctx.fillRect(0, 0, width / 2, width / 2);
    ctx.fillRect(width / 2, width / 2, width, width);
}
