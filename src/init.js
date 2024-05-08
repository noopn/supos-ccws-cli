const path = require("path");
const fse = require("fs-extra");
const spawn = require("cross-spawn");
const inquirer = require("inquirer");

const useYarn = spawn.sync("yarn", ["--version"]).stdout.toString();

const init = async (folderName) => {
  const cwd = process.cwd();
  const targetPath = path.join(cwd, folderName);
  if (fse.pathExistsSync(targetPath)) {
    await inquirer
      .prompt([
        {
          type: "confirm",
          name: "isDel",
          message: `The project folder [${folderName}] already exists, continuing will delete full folder. Do you want to continue?`,
        },
      ])
      .then((answer) => {
        if (answer.isDel) {
          fse.removeSync(targetPath);
        } else {
          process.exit(1);
        }
      });
  }

  fse.mkdirSync(targetPath);

  console.log("install dependencies");
  console.log();

  const template = "supos-ccws-template";

  const ver = spawn.sync("npm", ["show", template, "version"], {
    encoding: "utf8",
  });

  if (ver.stderr) {
    process.stdout.write(ver.stderr);
    process.exit(1);
  }

  const version = ver.stdout.split("/")[0];

  const command = useYarn ? "yarn" : "npm";

  let args = [useYarn ? "add" : "install", `${template}@^${version}`];

  if (!useYarn) {
    args.push("--save");
  }

  let result = spawn.sync(command, args, {
    stdio: "inherit",
    cwd: targetPath,
  });

  if (result.signal) {
    process.exit(1);
  }

  console.log();
  console.log("copy template");
  console.log();

  const sourcePath = path.join(targetPath, "node_modules", template);
  fse.copySync(sourcePath, targetPath);

  args = [useYarn ? "remove" : "uninstall", "--silent", template];

  result = spawn.sync(command, args, { stdio: "inherit", cwd: targetPath });

  if (result.signal) {
    process.exit(1);
  }

  console.log("supos-ccws-template init success!");
};

process.on("unhandledRejection", (err) => {
  throw err;
});

module.exports = init;
