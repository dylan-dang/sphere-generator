import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { defineConfig } from 'rollup';

export default (commandArgs) => defineConfig({
    input: 'src/index.ts',
    output: {
        file: 'dist/sphere_generator.js',
        format: 'iife',
    },
    plugins: [replace({
        DEBUG: commandArgs.configProduction == true ? 'false' : 'true',
        preventAssignment: true,
    }), typescript()],
});
