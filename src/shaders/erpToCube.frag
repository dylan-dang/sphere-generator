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
}