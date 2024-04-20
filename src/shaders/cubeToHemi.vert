uniform lowp int face;
varying vec2 texCoord;

void main() {
    texCoord = position;
    gl_Position = vec4(position, 1.0);
}