const path = require('path');
const fse = require('fs-extra');
const clone = require('git-clone/promise');
const spawn = require('cross-spawn')
const ora = require('ora');
const spinner = ora();

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

const init = (folderName) => {
    const cwd = process.cwd();
    const targetPath = path.join(cwd, folderName);
    spinner.start('pull supos-ccws-template');

    fse.removeSync(targetPath);
    fse.ensureDirSync(targetPath);

    clone('git@github.com:noopn/supos-ccws-template.git',targetPath,{checkout:'dev'})
        .then((err) => {
            if (err) throw new Error(err);
            spinner.succeed('pull supos-ccws-template succeed!');
            return new Promise((resolve, reject) => {
                const child = spawn(npm, ['install'], { stdio: 'inherit', cwd: targetPath });
                child.on('close', code => {
                    if (code !== 0) {
                        reject({
                            command: `error`,
                        });
                        return;
                    }
                    resolve();
                });
            })
        }).then(() => {
            spinner.succeed('install dependencies succeed!');
        }).catch(err => {
            spinner.fail('pull template error， check your network connection!\n', err);
            process.exit(0)
        })
}

module.exports = init;

