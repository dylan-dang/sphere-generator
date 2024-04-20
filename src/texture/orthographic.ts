import { Ctx, createProgram, useProgram } from './common';
import cubeToHemiFrag from '../shaders/cubeToHemi.frag';
import cubeToHemiVert from '../shaders/cubeToHemi.vert';
import THREE from 'three';

function renderHemisphere(
    ctx: Ctx,
    angleLocation: WebGLUniformLocation | null,
    phi: number,
    theta: number
) {
    const { gl, canvas } = ctx;
    gl.uniform2f(angleLocation, phi, theta);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return canvas.toDataURL();
}

export function renderOrthogonalHemispheres(ctx: Ctx) {
    const {
        gl,
        opts: { rotation },
    } = ctx;
    const program = createProgram(ctx, cubeToHemiVert, cubeToHemiFrag);
    useProgram(ctx, program);

    const rotationLocation = gl.getUniformLocation(program, 'rotation');
    const euler = new THREE.Euler(...rotation, 'XYZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);
    gl.uniform4f(rotationLocation, quat.x, quat.y, quat.z, quat.w);

    const angleLocation = gl.getUniformLocation(program, 'angle');
    let output: string[] = [];
    for (let i = 0; i < 4; i++) {
        output.push(renderHemisphere(ctx, angleLocation, 0, (i * Math.PI) / 2));
    }
    output.push(renderHemisphere(ctx, angleLocation, Math.PI / 2, Math.PI));
    output.push(renderHemisphere(ctx, angleLocation, -Math.PI / 2, Math.PI));
    return output;
}
