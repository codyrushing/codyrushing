const fs = require('fs');
const path = require('path');
const Bundler = require('parcel-bundler');

const distBase = path.join(__dirname, 'dist');
const srcBase = path.join(__dirname, 'assets');
const jsBase = path.join(srcBase, 'js');
const cssBase = path.join(srcBase, 'css');

const buildBundles = ({ dir, extension='.js'}, bundleOptions={watch: true, cache: true}) => fs.readdirSync(dir)
  .map(
    bundlePath => {
      try {
        const filePath = path.join(dir, bundlePath, `index${extension}`);
        const fileStats = fs.statSync(filePath);
        if(fileStats.isFile()){
          const b = new Bundler(filePath, {
            outDir: path.join( distBase, path.basename(bundlePath)),
            ...bundleOptions
          });
          b.bundle();
          return b;
        }
      } catch(err) {
        console.error(err);
      }
    }
  );

// js bundles are assets/js/[bundlename]/index.js
const jsBundles = buildBundles({ dir: jsBase });
const cssBundles = buildBundles({ dir: cssBase, extension: '.less' });
