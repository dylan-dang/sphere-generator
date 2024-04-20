varying vec3 pointOnCubeSurface;
uniform lowp int face;

#define u position.x
#define v position.y

#define NORTH 0
#define SOUTH 1
#define WEST  2
#define LEFT  3
#define UP    4
#define DOWN  5

void main() {
    switch (face) {
        case NORTH: pointOnCubeSurface = vec3(-v, 1.0, -u); break;
        case SOUTH: pointOnCubeSurface = vec3(-v, -1.0, u); break;
        case WEST:  pointOnCubeSurface = vec3(1.0, u, v); break;
        case LEFT:  pointOnCubeSurface = vec3(-1.0, u, -v); break;
        case UP:    pointOnCubeSurface = vec3(-v, u, 1.0); break;
        case DOWN:  pointOnCubeSurface = vec3(-v, -u, -1.0); break;
    }
    
    gl_Position = vec4(position, 1.0);
}