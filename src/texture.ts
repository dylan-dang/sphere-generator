import { error } from './common';
import { Options } from './dialog';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import {
    WebGLRenderer,
    WebGLCubeRenderTarget,
    PlaneGeometry,
    Scene,
    OrthographicCamera,
    ShaderMaterial,
    Mesh,
    TextureLoader,
    CubeTexture,
    CubeTextureLoader,
    Vector2,
    Quaternion,
    Euler,
    LinearFilter,
    NearestFilter,
} from 'three';

const missing =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURf8A/wAAAJ+mFPIAAAAJcEhZcwAADsIAAA7CARUoSoAAAACTSURBVHja7c4xDQAACASx928aJDAwQXoCmstUDQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbIEDiwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A0kDXH3Dske5kGcAAAAASUVORK5CYII=';

interface FaceInfo {
    face: CubeFaceDirection;
    angle: Vector2;
    adjustment: number;
}

interface TextureInfo {
    face: CubeFaceDirection;
    texture: Texture;
}

const faces: FaceInfo[] = [
    {
        face: 'north',
        angle: new Vector2(Math.PI / 2, Math.PI),
        adjustment: -Math.PI / 2,
    },
    {
        face: 'south',
        angle: new Vector2(-Math.PI / 2, Math.PI),
        adjustment: -Math.PI / 2,
    },
    {
        face: 'west',
        angle: new Vector2(0, (2 * Math.PI) / 2),
        adjustment: -Math.PI / 2,
    },
    {
        face: 'east',
        angle: new Vector2(0, 0),
        adjustment: Math.PI / 2,
    },
    {
        face: 'up',
        angle: new Vector2(0, (1 * Math.PI) / 2),
        adjustment: 0,
    },
    {
        face: 'down',
        angle: new Vector2(0, (3 * Math.PI) / 2),
        adjustment: Math.PI,
    },
];

export async function generateTextures(opts: Options) {
    const { textureLength, rotation } = opts;
    const renderer = new WebGLRenderer({
        antialias: false,
        preserveDrawingBuffer: true,
    });
    renderer.setSize(textureLength, textureLength);
    const texture = await loadTexture(renderer, opts);
    const planeGeometry = new PlaneGeometry(2, 2);
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const planeMaterial = new ShaderMaterial({
        uniforms: {
            cubemap: { value: texture },
            angle: { value: new Vector2() },
            rotation: {
                value: new Quaternion().setFromEuler(new Euler(...rotation)),
            },
        },
        fragmentShader,
        vertexShader,
    });
    const plane = new Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
    return faces.map(({ angle, face, adjustment }): TextureInfo => {
        planeMaterial.uniforms.angle.value = angle;
        renderer.render(scene, camera);
        const texture = new Texture({ name: face });
        texture.edit(
            (canvas) => {
                if (!(canvas instanceof HTMLCanvasElement))
                    throw error('canvas expected');
                canvas.width = canvas.height = textureLength;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw error("context2d couldn't be created");
                ctx.save();
                ctx.translate(textureLength / 2, textureLength / 2);
                ctx.rotate(adjustment);
                ctx.translate(-textureLength / 2, -textureLength / 2);
                ctx.translate(textureLength, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(renderer.domElement, 0, 0);
                ctx.restore();
            },
            { no_undo: true }
        );
        texture.add();
        return { face, texture };
    });
}

async function loadTexture(
    renderer: WebGLRenderer,
    opts: Options
): Promise<CubeTexture> {
    const {
        mapping,
        equirectangular,
        textureLength,
        north,
        south,
        west,
        east,
        up,
        down,
        smoothing,
    } = opts;
    const filter = smoothing ? LinearFilter : NearestFilter;
    if (mapping == 'equirectangular' && equirectangular) {
        const loader = new TextureLoader();
        const texture = await loader.loadAsync(equirectangular);
        texture.magFilter = texture.minFilter = filter;
        const target = new WebGLCubeRenderTarget(textureLength, {
            magFilter: filter,
            minFilter: filter,
        }).fromEquirectangularTexture(renderer, texture);
        return target.texture;
    }
    const loader = new CubeTextureLoader();
    let faces = [east, west, up, down, north, south];
    let processed = await Promise.all(faces.map(preprocessCubeFaces(opts)));
    const texture = await loader.loadAsync(processed);
    texture.magFilter = texture.minFilter = filter;
    return texture;
}

function drawMissingTexture(ctx: CanvasRenderingContext2D, length: number) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, length, length);
    ctx.fillStyle = 'magenta';
    ctx.fillRect(0, 0, length / 2, length / 2);
    ctx.fillRect(length / 2, length / 2, length, length);
}

function preprocessCubeFaces({ textureLength, smoothing, mapping }: Options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw error('Context2d could not be created');
    ctx.imageSmoothingEnabled = smoothing;
    canvas.width = canvas.height = textureLength;
    ctx.translate(textureLength, 0);
    ctx.scale(-1, 1);
    drawMissingTexture(ctx, textureLength);
    const missingTexture = canvas.toDataURL();
    ctx.clearRect(0, 0, textureLength, textureLength);

    return (src?: string): Promise<string> =>
        new Promise((resolve, reject) => {
            if (mapping != 'cube' || !src) return void resolve(missingTexture);
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, textureLength, textureLength);
                const url = canvas.toDataURL();
                resolve(url);
            };
            image.onerror = () => {
                reject(error(`Texture could not be loaded from file '${src}`));
            };
            image.src = src;
        });
}
