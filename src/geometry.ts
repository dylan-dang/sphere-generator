import { Options } from './dialog';
import { generateTextures } from './texture';
import { Vector3 } from 'three';
import { SIDES } from './common';
import THREE from 'three';

function mapUV(face: CubeFaceDirection, point: Vector3): ArrayVector4 {
    const a = ['west', 'east'].includes(face) ? point.z : point.x;
    const b = ['up', 'down'].includes(face) ? point.z : point.y;
    return [8 - a, 8 - b, 8 + a, 8 + b];
}

export async function generate(opts: Options) {
    Undo.initEdit({
        outliner: true,
        elements: [],
        textures: [],
        selection: true,
    });
    const { origin, geometryDetail, size } = opts;
    const originVec = new THREE.Vector3().fromArray(origin);

    let textures: Texture[] = await generateTextures(opts);
    const group = new Group({
        name: 'sphere',
        origin,
    }).init();

    const scaling = new THREE.Vector3().fromArray(size.map((i) => i / 2));

    const elements = subdivideOctant(geometryDetail).map((point) => {
        const corner = point.clone().multiply(scaling);
        point.multiplyScalar(8);
        const cube = new Cube({
            name: 'inscribed cuboid',
            to: corner.clone().add(originVec).toArray(),
            from: corner.negate().add(originVec).toArray(),
            origin,
            autouv: 0,
        })
            .addTo(group)
            .init();
        SIDES.forEach((side, i) => {
            cube.faces[side].extend({
                texture: textures[i],
                uv: mapUV(side, point),
            });
        });
        return cube;
    });

    Undo.finishEdit('Generated Shape', {
        outliner: true,
        elements,
        textures,
        group,
    });
}

/* based on fibonacci sphere */
function subdivideOctant(points: number) {
    // compensate for getting rid of z,x < 0
    const n = points * 4;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const verts: Vector3[] = [];
    for (let i = 0; i < n; i++) {
        const theta = (2 * Math.PI * i) / goldenRatio;
        const phi = Math.acos(1 - i / n);
        const vert = new Vector3().setFromSphericalCoords(1, phi, theta);
        if (vert.x > 0 && vert.z > 0) {
            verts.push(vert);
        }
    }
    return verts;
}
