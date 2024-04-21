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
import { SIDES } from './common';

const missing =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURf8A/wAAAJ+mFPIAAAAJcEhZcwAADsIAAA7CARUoSoAAAACTSURBVHja7c4xDQAACASx928aJDAwQXoCmstUDQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbIEDiwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A0kDXH3Dske5kGcAAAAASUVORK5CYII=';

const angles: Vector2[] = [
    new Vector2(0, 0),
    new Vector2(0, (1 * Math.PI) / 2),
    new Vector2(0, (2 * Math.PI) / 2),
    new Vector2(0, (3 * Math.PI) / 2),
    new Vector2(Math.PI / 2, Math.PI),
    new Vector2(-Math.PI / 2, Math.PI),
];

export async function generateTextures(opts: Options) {
    const { textureLength, rotation, smoothing } = opts;
    const renderer = new WebGLRenderer({
        antialias: false,
        preserveDrawingBuffer: true,
    });
    renderer.setSize(textureLength, textureLength);
    const texture = await loadTexture(renderer, opts);
    texture.magFilter = smoothing ? LinearFilter : NearestFilter;
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
    return angles.map((angle, i) => {
        planeMaterial.uniforms.angle.value = angle;
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL();
        const texture = new Texture({ name: SIDES[i] }).fromDataURL(dataURL);
        texture.add();
        return texture;
    });
}

async function loadTexture(
    renderer: WebGLRenderer,
    {
        mapping,
        equirectangular,
        textureLength,
        north,
        south,
        west,
        east,
        up,
        down,
    }: Options
): Promise<CubeTexture> {
    if (mapping == 'equirectangular' && equirectangular) {
        const loader = new TextureLoader();
        const texture = await loader.loadAsync(equirectangular);
        const target = new WebGLCubeRenderTarget(
            textureLength
        ).fromEquirectangularTexture(renderer, texture);
        return target.texture;
    }
    const loader = new CubeTextureLoader();
    console.log(equirectangular);
    const texture = await loader.loadAsync(
        [north, south, west, east, up, down].map((side) =>
            side && mapping == 'cube' ? side : missing
        )
    );
    return texture;
}
