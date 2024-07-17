const path = require("path");
const fse = require("fs-extra");
const spawn = require("cross-spawn");
const inquirer = require("inquirer");

const cwd = process.cwd();

const useYarn = spawn.sync("yarn", ["--version"]).stdout?.toString().trim();

const isInWorkspace = !!fse.pathExistsSync(path.join(cwd, "package.json"));

if (isInWorkspace) {
  console.log("you are already in a project, please select another directory");
  process.exit(1);
}

const init = async (folderName) => {
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

  console.log("start init workspace");

  const template = "supos-ccws-template";
  const scripts = "supos-ccws-scripts";

  const tplStd = spawn.sync("npm", ["show", template, "version"], {
    encoding: "utf8",
  });

  if (tplStd.stderr) {
    process.stdout.write(tplStd.stderr);
    process.exit(1);
  }

  const scriptsStd = spawn.sync("npm", ["show", scripts, "version"], {
    encoding: "utf8",
  });

  if (scriptsStd.stderr) {
    process.stdout.write(scriptsStd.stderr);
    process.exit(1);
  }

  const templateVersion = tplStd.stdout.split(/\n/)[0];

  const scriptsVersion = scriptsStd.stdout.split(/\n/)[0];

  const command = useYarn ? "yarn" : "npm";

  let args = [
    useYarn ? "add" : "install",
    `${template}@^${templateVersion}`,
    `${scripts}@^${scriptsVersion}`,
  ];
  console.clear();
  console.log(
    `install dependencies ${template}@^${templateVersion} ${scripts}@^${scriptsVersion}`
  );

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

  fse.copySync(path.join(sourcePath, "src"), path.join(targetPath, "src"));
  fse.copyFileSync(
    path.join(sourcePath, "ccws.config.json"),
    path.join(targetPath, "ccws.config.json")
  );
  fse.copyFileSync(
    path.join(sourcePath, "tsconfig.json"),
    path.join(targetPath, "tsconfig.json")
  );
  fse.copyFileSync(
    path.join(sourcePath, "README.md"),
    path.join(targetPath, "README.md")
  );

  spawn.sync(
    command,
    [useYarn ? "remove" : "uninstall", template, "--silent"],
    {
      stdio: "inherit",
      cwd: targetPath,
    }
  );

  const packageJson = {
    name: "supos-ccws-workspace",
    version: "1.0.0",
    license: "MIT",
    keywords: ["supos", "component workspace"],
    private: true,

    scripts: {
      pull: "supos-ccws-scripts pull --ignore-dependencies",
      "pull:deps": "supos-ccws-scripts pull",
      dev: "supos-ccws-scripts dev",
      build: "supos-ccws-scripts build",
      push: "supos-ccws-scripts push",
      test: "supos-ccws-scripts test",
    },
    dependencies: {
      [scripts]: `^${scriptsVersion}`,
    },
  };

  fse.writeFileSync(
    path.join(targetPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  console.log("supos-ccws-template init success!");
};

process.on("unhandledRejection", (err) => {
  throw err;
});

module.exports = init;
