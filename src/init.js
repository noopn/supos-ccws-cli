const path = require('path');
const fse = require('fs-extra');
const download = require('download-git-repo');
const spawn = require('cross-spawn')
const ora = require('ora');
const spinner = ora();


const init = (folderName) => {
    const cwd = process.cwd();
    const targetPath = path.join(cwd, folderName);
    spinner.start('pull supos-ccws-template');

    fse.remove(targetPath);
    fse.ensureDirSync(targetPath);
    
    new Promise((resolve, reject) => download(
        "direct:https://github.com/noopn/supos-ccws-template.git#dev",
        targetPath,
        { clone: true },
        resolve
    )).then((err) => {
        if (err) {
            spinner.fail('pull template error， check your network connection!\n',err);
            process.exit(0);
        };
        spinner.succeed('pull supos-ccws-template succeed!');
        return new Promise((resolve, reject) => {
            const child = spawn('npm', ['install'], { stdio: 'inherit',cwd:targetPath });
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
    }).then(res => {
        spinner.succeed('install dependencies succeed!');
    }).catch(err=>{
        console.log(err);
        process.exit(0)
    })
}

module.exports = init;

