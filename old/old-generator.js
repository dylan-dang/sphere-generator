(function () {
    'use strict';
    let menuAction;
    const SIDES = ['north', 'west', 'south', 'east', 'up', 'down'];

    const defaults = {
        mapping: 'equirectangular',
        texture_length: 512,
        textures: [],
        animate: false,
        rotation: [0, 0, 0],
        rotateTo: [0, 0, 0],
        frames: 16,
        timing_function: 'linear',
        time_curve: [0, 0, 1, 1],
        center: [8, 8, 8],
        size: [16, 16, 16],
        detail: 16,
    };

    const defaultMapping = 'equirectangular';
    const defaultTextureLength = 512;
    const animateByDefault = false;
    const defaultRotation = [0, 0, 0];
    const defaultFrameCount = 16;
    const defaultTimingFunction = 'linear';
    const defaultTimeCurve = [0, 0, 1, 1];
    const defaultCenter = [8, 8, 8];
    const defaultSize = [16, 16, 16];
    const defaultDetail = 16;

    class TextureMap {
        constructor(length, smoothing = true) {
            this.length = length;
            this.smoothing = smoothing;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = length;

            const gl = canvas.getContext('webgl');
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            this.gl = gl;

            this.loadShaderSources();
            this.ERPtoCubeFace = this.initProgram(
                this.ERPtoCubeFaceVertex,
                this.ERPtoCubeFaceFragment
            );
            this.CubeMapToHemisphere = this.initProgram(
                this.CubeMapToHemisphereVertex,
                this.CubeMapToHemisphereFragment
            );
        }

        loadShaderSources() {
            this.ERPtoCubeFaceVertex = /*glsl*/ `
                attribute vec2 position;
                varying vec3 pointOnCubeSurface;
                uniform lowp int face;
    
                #define u position.x
                #define v position.y
    
                #define NORTH face == 0
                #define SOUTH face == 1
                #define WEST  face == 2
                #define LEFT  face == 3
                #define UP    face == 4
                #define DOWN  face == 5
    
                void main() {
                    //switch case not available in OpenGL-ES 2.0
                    if      (NORTH) pointOnCubeSurface = vec3(-v, 1.0, -u);
                    else if (SOUTH) pointOnCubeSurface = vec3(-v, -1.0, u);
                    else if (WEST)  pointOnCubeSurface = vec3(1.0, u, v);
                    else if (LEFT)  pointOnCubeSurface = vec3(-1.0, u, -v);
                    else if (UP)    pointOnCubeSurface = vec3(-v, u, 1.0);
                    else if (DOWN)  pointOnCubeSurface = vec3(-v, -u, -1.0);
                    
                    gl_Position = vec4(position, 0, 1.0);
                }`;
            this.ERPtoCubeFaceFragment = /*glsl*/ `
                precision mediump float;
    
                varying vec3 pointOnCubeSurface;
                uniform sampler2D textureSampler;
                
                #define PI 3.14159265359
                #define TAU 6.28318530718
                
                #define x pointOnSphereSurface.x
                #define y pointOnSphereSurface.y
                #define z pointOnSphereSurface.z
                
                void main() {
                    vec3 pointOnSphereSurface = normalize(pointOnCubeSurface);
                
                    #define theta atan(x, y)
                    #define phi asin(z)
                    
                    #define u theta/TAU + .5
                    #define v phi/PI + .5
                
                    gl_FragColor = texture2D(textureSampler, vec2(u, v));
                }`;
            this.CubeMapToHemisphereVertex = /*glsl*/ `
                attribute vec2 position;
                uniform lowp int face;
                varying vec2 texCoord;
    
                void main() {
                    texCoord = position;
                    gl_Position = vec4(position, 0, 1.0);
                }`;
            this.CubeMapToHemisphereFragment = /*glsl*/ `
                precision mediump float;
                uniform samplerCube cubemap;
                varying vec2 texCoord;
    
                uniform vec2 angle;
                uniform vec4 rotation;
    
                #define initialPhi angle.x
                #define initialTheta angle.y
    
                #define u texCoord.x
                #define v texCoord.y
    
                void main() {
                    //formula is from https://en.wikipedia.org/wiki/Orthographic_map_projection
                    float rho = length(texCoord);
                    if (rho>1.0) return;
                    float c = asin(rho);
    
                    float phi = asin(cos(c)*sin(initialPhi) + v*sin(c)*cos(initialPhi)/rho);
                    float theta = initialTheta + atan(u*sin(c), rho*cos(c)*cos(initialPhi) - v*sin(c)*sin(initialPhi));
    
                    vec3 direction = vec3(cos(phi)*cos(theta), cos(phi)*sin(theta), sin(phi));
                    direction = direction + 2.0*cross(cross(direction, rotation.xyz) + rotation.w * direction, rotation.xyz);
                    //direction = direction + 2.0*cross(rotation.xyz, cross(rotation.xyz, direction) + rotation.w * direction);
                    gl_FragColor = textureCube(cubemap, direction);
                }`;
        }

        loadProgram(program) {
            const gl = this.gl;
            gl.useProgram(program);

            const cornerVertices = new Float32Array([
                -1, -1, -1, 1, 1, -1, 1, 1,
            ]);
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, cornerVertices, gl.STATIC_DRAW);
            this.draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            const positionAttribLocation = gl.getAttribLocation(
                program,
                'position'
            );
            gl.vertexAttribPointer(
                positionAttribLocation,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );
            gl.enableVertexAttribArray(positionAttribLocation);
        }

        initProgram(vertexShaderSrc, fragmentShaderSrc) {
            const gl = this.gl;
            const program = gl.createProgram();
            function attachShader(shaderType, shaderSrc) {
                const shader = gl.createShader(shaderType);
                gl.shaderSource(shader, shaderSrc);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                    console.error(gl.getShaderInfoLog(shader));
                gl.attachShader(program, shader);
            }
            attachShader(gl.VERTEX_SHADER, vertexShaderSrc);
            attachShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

            gl.linkProgram(program);
            return program;
        }

        setTexParameters(textureType) {
            const gl = this.gl;
            const smoothing = this.smoothing ? gl.LINEAR : gl.NEAREST;
            gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, smoothing);
            gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, smoothing);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        loadFromEquirectangular(image) {
            if (!image) return this.loadFromFaces();
            const gl = this.gl;
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            this.loadProgram(this.ERPtoCubeFace);

            //create 2d texture for equirectangular projection
            const ERP = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, ERP);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );
            this.setTexParameters(gl.TEXTURE_2D);

            //create empty cubemap to write to
            const cubemap = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
            this.setTexParameters(gl.TEXTURE_CUBE_MAP);
            for (let i = 0; i < 6; i++)
                gl.texImage2D(
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                    0,
                    gl.RGBA,
                    this.length,
                    this.length,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    null
                );

            //render each face to framebuffer and store it to the cubemap
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            const faceLocation = gl.getUniformLocation(
                this.ERPtoCubeFace,
                'face'
            );
            for (let i = 0; i < 6; i++) {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                    cubemap,
                    0
                );
                gl.uniform1i(faceLocation, i);
                this.draw();
            }

            //unbind framebuffer and delete objects
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFramebuffer(fbo);
            gl.deleteTexture(ERP);
        }

        loadFromFaces(north, west, south, east, up, down) {
            //resize images to the same length and correct face rotation
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.height = this.length;
            const rotate = (image, theta) => {
                ctx.restore();
                ctx.save();
                ctx.translate(this.length / 2, this.length / 2);
                ctx.rotate(theta);
                ctx.translate(-this.length / 2, -this.length / 2);
                if (image) {
                    ctx.drawImage(image, 0, 0, this.length, this.length);
                } else {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, this.length, this.length);
                    ctx.fillStyle = 'magenta';
                    ctx.fillRect(0, 0, this.length / 2, this.length / 2);
                    ctx.fillRect(
                        this.length / 2,
                        this.length / 2,
                        this.length,
                        this.length
                    );
                }
                return canvas;
            };

            //create cubemap texture and store faces to it
            const gl = this.gl;
            const cubemap = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
            this.setTexParameters(gl.TEXTURE_CUBE_MAP);
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rotate(north, -Math.PI / 2)
            );
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rotate(south, Math.PI / 2)
            );
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rotate(west, Math.PI)
            );
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rotate(east, 0)
            );
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rotate(up, -Math.PI / 2)
            );
            gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                rotate(down, -Math.PI / 2)
            );
        }

        renderSphereSides(alpha = 0, beta = 0, gamma = 0) {
            const gl = this.gl;
            this.loadProgram(this.CubeMapToHemisphere);
            let sides = [];

            const rotationLocation = gl.getUniformLocation(
                this.CubeMapToHemisphere,
                'rotation'
            );
            const euler = new THREE.Euler(alpha, beta, gamma, 'XYZ');
            const quaternion = new THREE.Quaternion().setFromEuler(euler);
            gl.uniform4f(rotationLocation, ...quaternion.toArray());

            const angleLocation = gl.getUniformLocation(
                this.CubeMapToHemisphere,
                'angle'
            );
            const renderHemisphere = (phi, theta) => {
                gl.uniform2f(angleLocation, phi, theta);
                this.draw();
                sides.push(this.gl.canvas.toDataURL());
            };
            for (let i = 0; i < 4; i++) renderHemisphere(0, (i * Math.PI) / 2);
            renderHemisphere(Math.PI / 2, Math.PI);
            renderHemisphere(-Math.PI / 2, Math.PI);
            return sides;
        }

        renderAnimationAtlas(
            beginningRotation,
            endingRotation,
            timeCurve,
            frameCount
        ) {
            const gl = this.gl;
            this.loadProgram(this.CubeMapToHemisphere);

            const sides = SIDES.map((_) => new Object());
            sides.forEach((side) => {
                side.canvas = document.createElement('canvas');
                [side.canvas.width, side.canvas.height] = [
                    this.length,
                    this.length * frameCount,
                ];
                side.ctx = side.canvas.getContext('2d');
            });

            const valueAt = (target) => {
                const x = (t) =>
                    timeCurve[0] * t * 3 * (1 - t) ** 2 +
                    timeCurve[2] * t * t * 3 * (1 - t) +
                    t * t * t;
                const y = (t) =>
                    timeCurve[1] * t * 3 * (1 - t) ** 2 +
                    timeCurve[3] * t * t * 3 * (1 - t) +
                    t * t * t;
                let bounds = {
                    lower: 0,
                    upper: 1,
                    get center() {
                        return (this.a + this.b) / 2;
                    },
                };
                do {
                    var guess = x(bounds.center);
                    bounds[guess < target ? 'lower' : 'upper'] = bounds.center;
                } while (Math.abs(target - guess) > 0.0001);
                return y(bounds.center);
            };

            const rotationLocation = gl.getUniformLocation(
                this.CubeMapToHemisphere,
                'rotation'
            );
            const renderHemisphere = (ctx, index, phi, theta) => {
                gl.uniform2f(angleLocation, phi, theta);
                this.draw();
                ctx.drawImage(gl.canvas, 0, index * this.length);
            };

            beginningRotation = [0, 0, 0];
            endingRotation = [0, 2 * Math.PI, 0];

            const angleLocation = gl.getUniformLocation(
                this.CubeMapToHemisphere,
                'angle'
            );
            const beginning = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(...beginningRotation, 'XYZ')
            );
            const ending = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(...endingRotation, 'XYZ')
            );
            //console.log(beginning, ending);

            frameCount--;
            for (let frame = 0; frame <= frameCount; frame++) {
                const rotation = beginning
                    .clone()
                    .slerp(ending, frame / frameCount);
                gl.uniform4f(rotationLocation, ...rotation.toArray());

                for (let i = 0; i < 4; i++)
                    renderHemisphere(sides[i].ctx, frame, 0, (i * Math.PI) / 2);
                renderHemisphere(sides[4].ctx, frame, Math.PI / 2, Math.PI);
                renderHemisphere(sides[5].ctx, frame, -Math.PI / 2, Math.PI);
            }

            return sides.map((side) => side.canvas.toDataURL());
        }
    }

    Plugin.register('old-generator', {
        title: 'Old Generator',
        author: 'Dylan Dang',
        description: 'Generates a textured sphere to import into Minecraft',
        icon: 'sports_volleyball',
        version: '0.0.1',
        variant: 'both',
        onload: () => {
            if (!window.http) {
                window.http = require('http');
                window.http
                    .createServer(function (req, res) {
                        res.writeHead(200);
                        Plugins.devReload();
                        res.end('plugins reloaded!');
                    })
                    .listen(8080);
            }

            MenuBar.addAction(createMenuAction(), 'filter');
            Group.all.forEach((group) => {
                group.remove();
            });
            textures.empty();
            generateSphere({
                mapping: 'equirectangular',
                texture_length: 512,
                textures: [],
                animate: false,
                rotation: [0, 0, 0],
                rotateTo: [0, 0, 0],
                frames: 16,
                timing_function: 'linear',
                time_curve: [0, 0, 1, 1],
                center: [0, 0, 0],
                size: [16, 16, 16],
                detail: 16,
            });
        },
        onunload: () => menuAction.delete(),
    });

    function createMenuAction() {
        menuAction = new Action('generate_sphere_old', {
            name: 'Generate Sphere',
            description: 'Generates a textured sphere to import into Minecraft',
            icon: 'sports_volleyball',
            click: () => (Format ? optionDialog().show() : null),
        });
        return menuAction;
    }

    function makeLabel(text) {
        return /*html*/ `<label class="name_space_left" style="text-transform: capitalize;">${text}:</label>`;
    }

    function imageInput(label, id) {
        return /*html*/ `
            <div class="dialog_bar form_bar form_bar_file">
                <input type="file" id="${id}" accept="image/*" style="display: none;" onchange="if(this.files.length) document.getElementById('${id}-path').value = this.files[0].path;">
                ${makeLabel(label)}
                <input id="${id}-path" class="dark_bordered half" type="text" onclick="document.getElementById('${id}').click();" readonly/>
                <i class="material-icons" style="pointer-events: none;">insert_drive_file</i>
                <div class="tool" style="float: none; vertical-align: top" onclick="document.getElementById('${id}-path').value = ''; document.getElementById('${id}').value = '';">
                    <i class="material-icons" onclick="document.getElementById('${id}-path').value = ''">clear</i>
                </div>
            </div>`;
    }

    function vectorInput(
        label,
        id,
        values,
        minimums = [],
        maximums = [],
        step = 1
    ) {
        const inputElements = values.reduce(
            (result, value, index) =>
                result +
                /*html*/ `
            <input class="dark_bordered focusable_input"
                type="number"
                style="flex: 1;"
                id="${id}_${index}"
                value="${value}"
                step="${step}"
                min="${minimums[index]}"
                max="${maximums[index]}">
        `,
            ''
        );

        return /*html*/ `
            <div class="dialog_bar form_bar form_bar_center">
                ${makeLabel(label)}
                <div id="${id}" class="dialog_vector_group half">${inputElements}</div>
            </div>`;
    }

    function VectorInput({ label, id, inputs = {} }) {
        const inputStrings = inputs.map(
            (input, index) => /*html*/ `
                <input 
                    class="dark_bordered focusable_input"
                    type="number"
                    style="flex: 1;"
                    id="${id}_${index}"
                    value="${input.value}"
                    step="${input.step}"
                    min="${input.min}"
                    max="${input.max}"
                >`
        );
        return /*html*/ `
        <div class="dialog_bar form_bar form_bar_center">
            ${makeLabel(label)}
            <div id="${id}" class="dialog_vector_group half">${inputStrings.join(
            ''
        )}</div>
        </div>`;
    }

    function NumberInput({
        label,
        id,
        value,
        onchange = '',
        min = 1,
        max = undefined,
        step = 1,
    }) {
        return /*html*/ `
            <div id="${id}-input" class="dialog_bar form_bar">
                ${makeLabel(label)}
                <input id="${id}" class="dark_bordered half focusable_input"
                    type="number"
                    value="${value}"
                    min="${min}"
                    max="${max}"
                    step="${step}"
                    onchange="${onchange}"/>
            </div>`;
    }

    function selectInput(label, id, value, options, onchange = '') {
        const optionElements = Object.entries(options)
            .map(
                ([id, displayName]) =>
                    /*html*/ `<option value="${id}" ${
                        id == value ? 'selected' : ''
                    }>${displayName}</option>`
            )
            .join('');

        return /*html*/ `
            <div class="dialog_bar form_bar">
                ${makeLabel(label)}
                <div class="bar_select half">
                    <select id="${id}" class="focusable_input" onchange="${onchange}">${optionElements}</select>
                </div>
            </div>`;
    }

    function checkboxInput(label, id, checked = false, onchange = '') {
        return /*html*/ `
            <div class="dialog_bar form_bar form_bar_0">
                ${makeLabel(label)}
                <input type="checkbox" class="focusable_input" id="${id}" onchange="${onchange}" ${
            checked ? 'checked' : ''
        }>
            </div>`;
    }

    function CheckboxInput({ label, id, checked, onChange = () => {} }) {
        return /*html*/ `
            <div class="dialog_bar form_bar form_bar_0">
                ${makeLabel(label)}
                <input 
                    type="checkbox"
                    class="focusable_input"
                    id="${id}"
                    onchange="(${onChange.toString()})()"
                    ${checked ? 'checked' : ''}
                >
            </div>`;
    }

    function wrap(content, id = '', style = '') {
        if (Array.isArray(content)) content = content.join('');
        return /*html*/ `<div id="${id}" style="${style}">${content}</div>`;
    }

    function Wrapper({ children, id = '', style = {} }) {
        const styleString = Object.entries(style)
            .map(([prop, value]) => `${prop}: ${value};`)
            .join('');
        return /*html*/ `
            <div id="${id}" style="${styleString}">
                ${Array.isArray(children) ? children.join('') : children}
            </div>`;
    }

    function SelectionInput({ label, id, options, value, onChange }) {
        return /*html*/ `
            <div class="dialog_bar form_bar">
                ${makeLabel(label)}
                <div class="bar_select half">
                    <select id="${id}" class="focusable_input" onchange="(${onChange.toString()})()">
                        ${options.map(
                            ({ displayName, id }) => /*html*/ `
                                <option 
                                    value="${id}"
                                    ${id == value ? 'selected' : ''}>
                                    ${displayName}
                                </option>`
                        )}
                    </select>
                </div>
            </div>`;
    }

    function optionDialog() {
        return new Dialog({
            id: 'sphere_generator_options',
            title: 'Options',
            draggable: true,
            lines: [
                SelectionInput({
                    label: 'Texture Map Method',
                    id: 'mapping',
                    value: defaultMapping,
                    onChange: () => {
                        for (let option of this.options) {
                            const section = document.getElementById(
                                `${option.value}-input`
                            );
                            section.style.display = option.selected
                                ? 'block'
                                : 'none';
                        }
                    },
                    options: [
                        {
                            displayName: 'Equirectangular',
                            id: 'equirectangular',
                        },
                        { displayName: 'Cube Map', id: 'cubemap' },
                    ],
                }),
                NumberInput({
                    label: 'Output Texture Length',
                    id: 'texture-length',
                    value: defaultTextureLength,
                }),
                Wrapper({
                    id: 'equirectangular-input',
                    style: {
                        display:
                            defaultMapping === 'equirectangular'
                                ? 'block'
                                : 'none',
                    },
                    children: imageInput('Texture', 'texture'),
                }),
                Wrapper({
                    id: 'cubemap-input',
                    style: {
                        display: defaultMapping == 'cubemap' ? 'block' : 'none',
                    },
                    children: SIDES.reduce(
                        (raw, side) =>
                            raw + imageInput(`${side} face`, `${side}-face`),
                        ''
                    ),
                }),
                `<hr>`,
                CheckboxInput({
                    label: 'Animate UV Rotation',
                    id: 'animate',
                    animateByDefault,
                    onChange: () => {
                        document.getElementById(
                            'animation-input'
                        ).style.display = this.checked ? 'block' : 'none';
                    },
                }),
                VectorInput({
                    label: 'Rotation',
                    id: 'rotation',
                    inputs: defaultRotation.map((rotation) => ({
                        value: rotation,
                    })),
                }),
                Wrapper({
                    id: 'animation-input',
                    style: {
                        display: animateByDefault ? 'block' : 'none',
                    },
                    children: [
                        VectorInput({
                            label: 'Rotate To',
                            id: 'rotate-to',
                            inputs: defaultRotation.map((rotation) => ({
                                value: rotation,
                            })),
                        }),
                        NumberInput({
                            label: 'Frame Count',
                            id: 'frames',
                            value: defaultFrameCount,
                        }),
                        SelectionInput({
                            label: 'Timing Function',
                            id: 'timing-function',
                            value: defaultTimingFunction,
                            options: [
                                { id: 'linear', displayName: 'Linear' },
                                { id: 'ease', displayName: 'Ease' },
                                { id: 'easeIn', displayName: 'Ease In' },
                                { id: 'easeOut', displayName: 'Ease Out' },
                                {
                                    id: 'easeInOut',
                                    displayName: 'Ease In And Out',
                                },
                                { id: 'bezier', displayName: 'Cubic Bezier' },
                            ],
                            onChange: () => {
                                const bezierInput =
                                    document.getElementById('bezier-input');
                                bezierInput.style.display =
                                    this.value == 'bezier' ? 'block' : 'none';
                            },
                        }),
                        Wrapper({
                            children: vectorInput(
                                'Cubic Bezier',
                                'bezier',
                                defaultTimeCurve,
                                [0, undefined, 0, undefined],
                                [1, undefined, 1, undefined],
                                0.01
                            ),
                            id: 'bezier-input',
                            style: {
                                display: 'none',
                            },
                        }),
                    ],
                }),
                `<hr>`,
                VectorInput({
                    label: 'Center',
                    id: 'origin',
                    inputs: defaultCenter.map((input) => ({ value: input })),
                }),
                VectorInput({
                    label: 'Size',
                    id: 'size',
                    inputs: defaultSize.map((input) => ({ value: input })),
                }),
                NumberInput({
                    label: 'Geometry Detail',
                    id: 'detail',
                    value: defaultDetail,
                    onChange: () => {
                        const detail = parseInt(this.value);
                        document.getElementById('element-count').textContent =
                            (3 * detail * (detail - 1)) / 2 +
                            1 +
                            ' elements will be generated.';
                    },
                }),
                /*html*/ `
            <p style="text-align: center;" id='element-count'>${
                (3 * defaultDetail * (defaultDetail - 1)) / 2 + 1
            } elements will be generated</p>
            `,
            ],
            onConfirm: generateSphere,
        });
    }

    function readImageInput(id) {
        return new Promise((resolve, reject) => {
            const input = document.getElementById(id);
            if (!input.files.length) resolve(null);
            const image = new Image();
            image.onload = function () {
                URL.revokeObjectURL(this.src);
                resolve(this);
            };
            image.onerror = () => {
                Blockbench.showMessageBox({
                    title: 'Warning',
                    message: `Texture could not be loaded from file '${input.files[0].name}'.`,
                    icon: 'warning',
                });
                reject(new Error('Texture error'));
            };
            image.src = URL.createObjectURL(input.files[0]);
        });
    }

    async function getFormData() {
        let data = defaults;
        const getValue = (id) => document.getElementById(id).value;
        const getVectorValues = (id) =>
            [...document.getElementById(id).children].map((input) =>
                parseFloat(input.value)
            );
        const isChecked = (id) => document.getElementById(id).checked;

        data.mapping = getValue('mapping');
        data.texture_length = parseInt(getValue('texture-length'));
        const texture_inputs =
            data.mapping == 'cubemap'
                ? SIDES.map((side) => `${side}-face`)
                : ['texture'];
        data.textures = await Promise.all(
            texture_inputs.map((input) => readImageInput(input))
        );

        data.animate = isChecked('animate');
        data.rotation = getVectorValues('rotation').map(
            (i) => (i * Math.PI) / 180
        );
        data.rotateTo = getVectorValues('rotate-to').map(
            (i) => (i * Math.PI) / 180
        );
        data.frames = parseInt(getValue('frames'));
        switch (getValue('timing-function')) {
            case 'linear':
                data.time_curve = [0, 0, 1, 1];
                break;
            case 'ease':
                data.time_curve = [0.25, 0.1, 0.25, 1];
                break;
            case 'easeIn':
                data.time_curve = [0.42, 0, 1, 1];
                break;
            case 'easeOut':
                data.time_curve = [0, 0, 0.58, 1];
                break;
            case 'easeInOut':
                data.time_curve = [0.42, 0, 0.58, 1];
                break;
            case 'bezier':
                data.time_curve = getVectorValues('bezier');
                break;
        }

        data.center = getVectorValues('origin');
        data.size = getVectorValues('size');
        data.detail = parseInt(getValue('detail'));

        return data;
    }

    async function generateSphere(data) {
        if (!data) data = defaults;
        let elements = [];

        const center = new THREE.Vector3().fromArray(data.center ?? [8, 8, 8]);
        Undo.initEdit({
            outliner: true,
            elements,
            /*textures: [],*/ selection: true,
        });
        const sphereGroup = new Group({
            name: 'sphere',
            origin: center.toArray(),
        }).init();

        const textureMap = new TextureMap(data.texture_length);
        switch (data.mapping) {
            case 'equirectangular':
                textureMap.loadFromEquirectangular(...data.textures);
                break;
            case 'cubemap':
                textureMap.loadFromFaces(...data.textures);
                break;
            default:
                textureMap.loadFromFaces();
        }
        const sideData = data.animate
            ? textureMap.renderAnimationAtlas(
                  data.rotation,
                  data.rotateTo,
                  data.time_curve,
                  data.frames
              )
            : textureMap.renderSphereSides(...data.rotation);
        const sides = sideData.map((dataURL, index) =>
            new Texture({
                name: SIDES[index],
                id: SIDES[index],
            }).fromDataURL(dataURL)
        );

        function getUV(face, point) {
            const a = ['west', 'east'].includes(face) ? point.z : point.x;
            const b = ['up', 'down'].includes(face) ? point.z : point.y;
            return [8 - a, 8 - b, 8 + a, 8 + b];
        }
        pointsOfSubdividedOctant(data.detail).forEach((point) => {
            const corner = point
                .clone()
                .multiply(
                    new THREE.Vector3().fromArray(data.size.map((i) => i / 2))
                );
            const to = corner.clone().add(center);
            const from = corner.negate().add(center);
            point.multiplyScalar(8);
            elements.push(
                new Cube({
                    name: 'inscribed cuboid',
                    to: to.toArray(),
                    from: from.toArray(),
                    origin: center.toArray(),
                    autouv: 0,
                    faces: Object.fromEntries(
                        SIDES.map((side, index) => [
                            side,
                            new Face(
                                side,
                                {
                                    uv: getUV(side, point),
                                    texture: sides[index].uuid,
                                },
                                this
                            ),
                        ])
                    ),
                })
                    .addTo(sphereGroup)
                    .init()
            );
        });

        Undo.finishEdit('Generated Shape', { outliner: true, elements });
    }

    function pointsOfSubdividedOctant(n) {
        let points = [];
        const template = [(i) => i / n, (_, j) => j / n, () => 1];
        const getCoords = (i, j) => template.map((fn) => fn(i, j));
        for (let face = 0; face < 3; face++) {
            template.unshift(template.pop());
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const corner1 = new THREE.Vector3(
                        ...getCoords(i, j)
                    ).normalize();
                    const corner2 = new THREE.Vector3(
                        ...getCoords(i + 1, j + 1)
                    ).normalize();
                    points.push(corner1.lerp(corner2, 0.5));
                }
            }
        }
        return points;
    }

    // function pointsOfSubdividedOctant(n) {
    //     let points = [];
    //     const HALF_PI = Math.PI / 2;
    //     for (let levelAngle = HALF_PI / n; levelAngle < HALF_PI; levelAngle += HALF_PI / n) {
    //         const levelRadius = Math.cos(levelAngle);
    //         const y = Math.sin(levelAngle);
    //         const levelSubdivisions = Math.round(n * levelRadius) || 1;
    //         for (
    //             let levelSubdivisionAngle = HALF_PI / levelSubdivisions;
    //             levelSubdivisionAngle < HALF_PI;
    //             levelSubdivisionAngle += HALF_PI / levelSubdivisions
    //         ) {
    //             const x = levelRadius * Math.cos(levelSubdivisionAngle);
    //             const z = levelRadius * Math.sin(levelSubdivisionAngle);
    //             points.push(new THREE.Vector3(x, y, z));
    //         }
    //     }
    //     return points;
    // }

    /*
    function pointsOfSubdividedOctant(n) {
        // n *= 1.5;
        let midpoints = [];
        let top = { at: () => new THREE.Vector3(1, 0, 0) };
        for (let strip = 1; strip < n + 1; strip++) {
            let vertices = [];
            const vertexFrom = (border, t) => vertices.push(border.at(t, new THREE.Vector3()));
            const bottom = new THREE.Line3(
                new THREE.Vector3(1 - strip / n, strip / n, 0),
                new THREE.Vector3(1 - strip / n, 0, strip / n)
            );
            for (let cut = 0; cut < strip; cut++) {
                vertexFrom(bottom, cut / strip);
                if (cut > 0 && strip < n) midpoints.push(bottom.at(cut / strip, new THREE.Vector3()).normalize());
                vertexFrom(top, cut / (strip - 1));
            }
            vertexFrom(bottom, 1);

            let triangle = new THREE.Triangle();
            for (let vert = 0; vert < vertices.length - 2; vert++) {
                triangle.setFromPointsAndIndices(vertices, vert, vert + 1, vert + 2);
                let midpoint = triangle.getMidpoint(new THREE.Vector3());
                midpoints.push(midpoint.normalize());
            }
            top = bottom;
        }
        return midpoints;
    }
    //*/
})();
