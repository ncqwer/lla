/* 
  this file copy from 
  https://github.com/ianstormtaylor/slate-plugins/tree/master/support/rollup 
  and add some custom changes
*/

import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import less from 'rollup-plugin-less';
import { terser } from 'rollup-plugin-terser';
// eslint-disable-next-line
import json from '@rollup/plugin-json';

const PKG_SCOPE = '';

/**
 * Return a Rollup configuration for a `pkg` with `env` and `target`.
 *
 * @param {Object} pkg
 * @param {String} env
 * @param {String} format
 * @return {Object}
 */

function configure(pkg, env) {
  const isProd = env === 'production';
  const realPkgName = pkg.name.replace(PKG_SCOPE, '');
  const input = `packages/${realPkgName}/src/index.js`;
  const deps = []
    .concat(pkg.dependencies ? Object.keys(pkg.dependencies) : [])
    .concat(pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : []);
  const plugins = [
    // Allow Rollup to resolve modules from `node_modules`, since it only
    // resolves local modules by default.
    resolve({
      browser: true,
    }),

    // Allow Rollup to resolve CommonJS modules, since it only resolves ES2015
    // modules by default.
    // isUmd &&
    commonjs({
      exclude: [`packages/${realPkgName}/src/**`],
      // HACK: Sometimes the CommonJS plugin can't identify named exports, so
      // we have to manually specify named exports here for them to work.
      // https://github.com/rollup/rollup-plugin-commonjs#custom-named-exports
      namedExports: {
        esrever: ['reverse'],
        immutable: ['List', 'Map', 'Record', 'OrderedSet', 'Set', 'Stack', 'is'],
        'react-dom': ['findDOMNode'],
        'react-dom/server': ['renderToStaticMarkup'],
      },
    }),

    // Convert JSON imports to ES6 modules.
    json(),
    less({
      output: `./packages/${realPkgName}/lib/index.css`,
    }),
    // Replace `process.env.NODE_ENV` with its value, which enables some modules
    // like React and Slate to use their production variant.
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),

    // Register Node.js builtins for browserify compatibility.
    builtins(),

    // Use Babel to transpile the result, limiting it to the source code.
    babel({
      include: [`packages/${realPkgName}/src/**`],
      babelrc: false,
      presets: [['@babel/preset-env', { modules: false }], '@babel/preset-react'],
    }),

    // Register Node.js globals for browserify compatibility.
    globals(),
  ].filter(Boolean);

  return {
    plugins,
    input,
    output: [
      {
        file: `packages/${realPkgName}/${pkg.module}`,
        format: 'es',
        sourcemap: true,
      },
      {
        file: `packages/${realPkgName}/${pkg.main}`,
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
        plugins: [isProd && terser()].filter(Boolean),
      },
    ],

    external: id => {
      return !!deps.find(dep => dep === id || id.startsWith(`${dep}/`));
    },
    watch: {
      include: `packages/${realPkgName}/src/**`,
      clearScreen: true,
      chokidar: true,
    },
  };
}

/**
 * Return a Rollup configuration for a `pkg`.
 *
 * @return {Array}
 */

function factory(pkg) {
  const isProd = process.env.NODE_ENV === 'production';
  return [!isProd && configure(pkg, 'development'), isProd && configure(pkg, 'production')].filter(
    Boolean,
  );
}

/**
 * Export.
 *
 * @type {Function}
 */

export default factory;
