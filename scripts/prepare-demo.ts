import shelljs from 'shelljs';


shelljs.rm('-rf', './demo/web_modules');
shelljs.mkdir('-p', './demo/web_modules/talk-control-revealjs-extensions');
shelljs.cp('-rf', './dist/*', './demo/web_modules/talk-control-revealjs-extensions');
