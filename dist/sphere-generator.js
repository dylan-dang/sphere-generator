(function (THREE) {
    'use strict';

    const id = 'sphere-generator';
    const manifest = {
        title: "Sphere Generator",
        author: "Dylan Dang",
        description: "Generates a textured sphere block model",
        icon: "sports_volleyball",
        variant: "both",
        version: "0.0.1"
    };
    const { title, author, description, icon, variant, version } = manifest;

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    function error(message) {
        Blockbench.showQuickMessage(message, 2000);
        return new Error(message);
    }

    const SIDES = ['north', 'south', 'west', 'east', 'up', 'down'];
    function createContext(opts) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = length;
        const gl = canvas.getContext('webgl');
        if (!gl)
            throw error('WebGL failed to load');
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        return {
            gl,
            canvas,
            opts,
        };
    }
    function createShader(ctx, shaderType, src) {
        var _a;
        const { gl } = ctx;
        const shader = gl.createShader(shaderType);
        if (!shader)
            throw error('WebGL Shader failed to be created');
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw error((_a = gl.getShaderInfoLog(shader)) !== null && _a !== void 0 ? _a : 'Shader failed to compile');
        return shader;
    }
    function createProgram(ctx, vertSrc, fragSrc) {
        const { gl } = ctx;
        const program = gl.createProgram();
        if (!program)
            throw error('WebGL program failed to be created');
        const vertShader = createShader(ctx, gl.VERTEX_SHADER, vertSrc);
        const fragShader = createShader(ctx, gl.FRAGMENT_SHADER, fragSrc);
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        return program;
    }
    function useProgram({ gl }, prog) {
        gl.useProgram(prog);
        const cornerVertices = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, cornerVertices, gl.STATIC_DRAW);
        const positionAttribLocation = gl.getAttribLocation(prog, 'position');
        gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);
    }
    function defaultTex({ gl, opts: { smoothing } }, type) {
        const filter = smoothing ? gl.LINEAR : gl.NEAREST;
        gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    function loadImg(src) {
        return new Promise((resolve, reject) => {
            if (!src)
                return void resolve(null);
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

    function loadCube(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { gl, opts } = ctx;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = opts.textureLength;
            const cubemap = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
            defaultTex(ctx, gl.TEXTURE_CUBE_MAP);
            // correct rotation and output texture size
            const images = yield Promise.all(SIDES.map((side) => opts[side])
                .map(loadImg));
            images.forEach(renderFace, { canvas, ctx });
        });
    }
    function renderFace(image, index) {
        const { canvas, ctx: { gl }, } = this;
        const { width } = canvas;
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d)
            throw error('2D Canvas Context could not be created');
        ctx2d.save();
        // correct rotation
        rotateFace(ctx2d, width, (Math.PI * [-1, 1, 2, 0, -1, -1][index]) / 2);
        if (image) {
            ctx2d.drawImage(image, 0, 0, width, width);
        }
        else {
            drawMissingTexture(ctx2d, width);
        }
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        ctx2d.restore();
    }
    function rotateFace(ctx, width, angle) {
        ctx.translate(width / 2, width / 2);
        ctx.rotate(angle);
        ctx.translate(-width / 2, -width / 2);
    }
    function drawMissingTexture(ctx, width) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, width);
        ctx.fillStyle = 'magenta';
        ctx.fillRect(0, 0, width / 2, width / 2);
        ctx.fillRect(width / 2, width / 2, width, width);
    }

    var erpToCubeFrag = "precision mediump float;\n#define GLSLIFY 1\n    \nvarying vec3 pointOnCubeSurface;\nuniform sampler2D textureSampler;\n\n#define PI 3.14159265359\n#define TAU 6.28318530718\n\n#define x pointOnSphereSurface.x\n#define y pointOnSphereSurface.y\n#define z pointOnSphereSurface.z\n\nvoid main() {\n    vec3 pointOnSphereSurface = normalize(pointOnCubeSurface);\n\n    #define theta atan(x, y)\n    #define phi asin(z)\n    \n    #define u theta/TAU + .5\n    #define v phi/PI + .5\n\n    gl_FragColor = texture2D(textureSampler, vec2(u, v));\n}"; // eslint-disable-line

    var erpToCubeVert = "#define GLSLIFY 1\nattribute vec2 position;\nvarying vec3 pointOnCubeSurface;\nuniform lowp int face;\n\n#define u position.x\n#define v position.y\n\n#define NORTH face == 0\n#define SOUTH face == 1\n#define WEST  face == 2\n#define LEFT  face == 3\n#define UP    face == 4\n#define DOWN  face == 5\n\nvoid main() {\n    //switch case not available in OpenGL-ES 2.0\n    if      (NORTH) pointOnCubeSurface = vec3(-v, 1.0, -u);\n    else if (SOUTH) pointOnCubeSurface = vec3(-v, -1.0, u);\n    else if (WEST)  pointOnCubeSurface = vec3(1.0, u, v);\n    else if (LEFT)  pointOnCubeSurface = vec3(-1.0, u, -v);\n    else if (UP)    pointOnCubeSurface = vec3(-v, u, 1.0);\n    else if (DOWN)  pointOnCubeSurface = vec3(-v, -u, -1.0);\n    \n    gl_Position = vec4(position, 0, 1.0);\n}"; // eslint-disable-line

    function loadEquirectangular(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { gl, opts: { texture: src }, } = ctx;
            const img = yield loadImg(src);
            if (!img) {
                for (const side of SIDES) {
                    ctx.opts[side] = undefined;
                }
                loadCube(ctx);
                return;
            }
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
        });
    }
    function createEquirectangular2dTexture(ctx, img) {
        const { gl } = ctx;
        const texture = gl.createTexture();
        if (!texture)
            throw error('Texture could not be created');
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        defaultTex(ctx, gl.TEXTURE_2D);
        return texture;
    }
    function createCubeMap(ctx) {
        const { gl, opts: { textureLength }, } = ctx;
        const cubemap = gl.createTexture();
        if (!cubemap)
            throw error('Cubemap texture could not be created');
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
        defaultTex(ctx, gl.TEXTURE_CUBE_MAP);
        for (let i = 0; i < SIDES.length; i++) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, textureLength, textureLength, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        return cubemap;
    }
    function createFrameBuffer(gl, prog, cubemap) {
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        const faceLocation = gl.getUniformLocation(prog, 'face');
        for (let i = 0; i < SIDES.length; i++) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubemap, 0);
            gl.uniform1i(faceLocation, i);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        return fbo;
    }

    var cubeToHemiFrag = "precision mediump float;\n#define GLSLIFY 1\nuniform samplerCube cubemap;\nvarying vec2 texCoord;\n\nuniform vec2 angle;\nuniform vec4 rotation;\n\n#define initialPhi angle.x\n#define initialTheta angle.y\n\n#define u texCoord.x\n#define v texCoord.y\n\nvoid main() {\n    //formula is from https://en.wikipedia.org/wiki/Orthographic_map_projection\n    float rho = length(texCoord);\n    if (rho>1.0) return;\n    float c = asin(rho);\n\n    float phi = asin(cos(c)*sin(initialPhi) + v*sin(c)*cos(initialPhi)/rho);\n    float theta = initialTheta + atan(u*sin(c), rho*cos(c)*cos(initialPhi) - v*sin(c)*sin(initialPhi));\n\n    vec3 direction = vec3(cos(phi)*cos(theta), cos(phi)*sin(theta), sin(phi));\n    direction = direction + 2.0*cross(cross(direction, rotation.xyz) + rotation.w * direction, rotation.xyz);\n    //direction = direction + 2.0*cross(rotation.xyz, cross(rotation.xyz, direction) + rotation.w * direction);\n    gl_FragColor = textureCube(cubemap, direction);\n}"; // eslint-disable-line

    var cubeToHemiVert = "#define GLSLIFY 1\nattribute vec2 position;\nuniform lowp int face;\nvarying vec2 texCoord;\n\nvoid main() {\n    texCoord = position;\n    gl_Position = vec4(position, 0, 1.0);\n}"; // eslint-disable-line

    function renderHemisphere(ctx, angleLocation, phi, theta) {
        const { gl, canvas } = ctx;
        gl.uniform2f(angleLocation, phi, theta);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return canvas.toDataURL();
    }
    function renderOrthogonalHemispheres(ctx) {
        const { gl, opts: { rotation } } = ctx;
        const program = createProgram(ctx, cubeToHemiVert, cubeToHemiFrag);
        useProgram(ctx, program);
        const rotationLocation = gl.getUniformLocation(program, 'rotation');
        const euler = new THREE.Euler(...rotation, 'XYZ');
        const quat = new THREE.Quaternion().setFromEuler(euler);
        gl.uniform4f(rotationLocation, quat.x, quat.y, quat.z, quat.w);
        const angleLocation = gl.getUniformLocation(program, 'angle');
        let output = [];
        for (let i = 0; i < 4; i++) {
            output.push(renderHemisphere(ctx, angleLocation, 0, (i * Math.PI) / 2));
        }
        output.push(renderHemisphere(ctx, angleLocation, Math.PI / 2, Math.PI));
        output.push(renderHemisphere(ctx, angleLocation, -Math.PI / 2, Math.PI));
        return output;
    }

    function generateTextures(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = createContext(opts);
            yield ({
                equirectangular: loadEquirectangular,
                cube: loadCube
            })[opts.mapping](ctx);
            return renderOrthogonalHemispheres(ctx).map((dataUrl, i) => {
                console.log(dataUrl);
                return new Texture({
                    name: SIDES[i],
                    id: SIDES[i]
                }).fromDataURL(dataUrl);
            });
        });
    }

    function mapUV(face, point) {
        const a = ['west', 'east'].includes(face) ? point.z : point.x;
        const b = ['up', 'down'].includes(face) ? point.z : point.y;
        return [8 - a, 8 - b, 8 + a, 8 + b];
    }
    function generate(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            Undo.initEdit({ outliner: true, elements: [], textures: [], selection: true });
            const { origin, geometryDetail, size } = opts;
            const originVec = new THREE.Vector3().fromArray(origin);
            let textures = yield generateTextures(opts);
            const group = new Group({
                name: 'sphere',
                origin
            });
            const scaling = new THREE.Vector3().fromArray(size.map((i) => i / 2));
            const elements = subdivideOctant(geometryDetail).map((point) => {
                const corner = point.clone().multiply(scaling);
                point.multiplyScalar(8);
                const cube = new Cube({
                    name: 'inscribed cuboid',
                    to: corner.clone().add(originVec).toArray(),
                    from: corner.negate().add(originVec).toArray(),
                    origin,
                    autouv: 0
                });
                cube.faces = Object.fromEntries(SIDES.map((side, i) => [
                    side,
                    new CubeFace(side, {
                        uv: mapUV(side, point),
                        texture: textures[i]
                    }, cube),
                ]));
                cube.addTo(group);
                cube.init();
                return cube;
            });
            Undo.finishEdit('Generated Shape', { outliner: true, elements, textures, group });
        });
    }
    /* based on fibonacci sphere */
    function subdivideOctant(points) {
        // compensate for getting rid of z,x < 0
        const n = points * 4;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const verts = [];
        for (let i = 0; i < n; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - i / n);
            const vert = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
            if (vert.x > 0 && vert.z > 0) {
                verts.push(vert);
            }
        }
        return verts;
    }

    function imageInput(mappingCondition, label) {
        return {
            type: "file",
            label,
            readtype: "image",
            placeholder: 'Missing',
            extensions: ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif', 'gif'],
            condition: ({ mapping }) => mapping == mappingCondition
        };
    }
    const form = {
        mapping: {
            type: 'select',
            label: 'Texture Mapping',
            options: {
                equirectangular: 'Equirectangular',
                cube: 'Cube'
            }
        },
        textureLength: { type: 'number', label: 'Texture Length', value: 512 },
        rotation: { type: 'vector', label: 'Rotation', value: [0, 0, 0] },
        origin: { type: 'vector', label: 'Position', value: [8, 8, 8] },
        size: { type: 'vector', label: 'Size', value: [16, 16, 16] },
        geometryDetail: { type: 'number', label: 'Geometry Detail', value: 2 },
        _: '_',
        smoothing: { type: 'checkbox', label: 'Smoothing', value: true },
        texture: imageInput('equirectangular', 'Texture'),
        north: imageInput('cube', 'North'),
        south: imageInput('cube', 'South'),
        east: imageInput('cube', 'East'),
        west: imageInput('cube', 'West'),
        up: imageInput('cube', 'Top'),
        down: imageInput('cube', 'Bottom'),
    };
    var dialog = new Dialog({
        id: `${id}-dialog`,
        title: `${title} Options`,
        form,
        onConfirm(data) {
            generate(data);
        },
    });

    const menuAction = new Action(`${id}-action`, {
        name: title,
        description,
        icon,
        condition: {
            modes: ['edit']
        },
        click: () => dialog.show(),
    });
    BBPlugin.register(id, Object.assign(Object.assign({}, manifest), { onload() {
            MenuBar.addAction(menuAction, 'tools');
        },
        onunload() {
            menuAction.delete();
            dialog.delete();
        },
        oninstall() { },
        onuninstall() { } }));

})(THREE);
