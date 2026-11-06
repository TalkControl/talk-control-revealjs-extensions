import shelljs from 'shelljs';

// Vendors a frozen copy of reveal.js's own dist (already a project
// dependency) into the deliberately-broken a11y fixture, the same way
// prepare-demo.ts vendors this library's own dist into demo/web_modules.
// Generated, never committed (fixtures/a11y/web_modules/ matches the
// existing web_modules/ .gitignore rule).
shelljs.rm('-rf', './fixtures/a11y/web_modules');
shelljs.mkdir('-p', './fixtures/a11y/web_modules');
shelljs.cp(
    [
        './node_modules/reveal.js/dist/reveal.esm.js',
        './node_modules/reveal.js/dist/reveal.css',
        './node_modules/reveal.js/dist/reset.css',
    ],
    './fixtures/a11y/web_modules'
);
