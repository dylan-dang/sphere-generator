attribute vec2 position;
uniform lowp int face;
varying vec2 texCoord;

void main() {
    texCoord = position;
    gl_Position = vec4(position, 0, 1.0);
}