const path = require('path');
const fse = require('fs-extra');
const spawn = require('cross-spawn')

const init = (folderName) => {
    const cwd = process.cwd();
    const targetPath = path.join(cwd, folderName);
    if(fse.pathExistsSync(targetPath)) {
        console.log();
        console.log('path existed  removing old path');
        console.log();

        fse.removeSync(targetPath);
    }
    fse.mkdirSync(targetPath);

    console.log('install dependencies');
    console.log();

    const template = 'supos-ccws-template';
    
    let args = [
        'install',
        '--save'
    ]
    args.push(template);

    new Promise((resolve, reject) => {
        const child = spawn('npm',args, { stdio: 'inherit', cwd: targetPath });
        child.on('close', code => {
            if (code !== 0) {
                reject({
                    command: `error`,
                });
                return;
            }
            resolve();
        });
    }).then(()=>{
        console.log();
        console.log('copy template');
        console.log();

        const sourcePath = path.join(targetPath,'node_modules',template);
        fse.copySync(sourcePath,targetPath);

        args = ['uninstall','--silent',template];
        return new Promise((resolve)=>{
            const child = spawn('npm',args, { stdio: 'inherit', cwd: targetPath });
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
    })
    .then(()=>{
        console.log('supos-ccws-cli install success!')
    })
    .catch(err=>{
        console.log(err);
    })
}

module.exports = init;

