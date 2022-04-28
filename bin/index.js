#!/usr/bin/env node
const pkg = require("../package.json");
const cwdPath = process.cwd();
const fs = require("fs");
const commander = require("commander");
const chalk = require("chalk");
const { apiBuilder } = require("./api");

commander.version(pkg.version).description("api代码生成工具");

// api操作
commander
  .description("api代码生成工具")
  .option("--source <source>", "数据源")
  .option("--s <source>", "数据源")
  .option("--server", "服务端代码")
  .option("--client", "客户端代码")
  .action(function (cmd) {
    // api源文件名
    const apiName = cmd.source || cmd.s || "api";
    // api源文件路径
    const apiJsonFilePath = `${cwdPath}/${apiName}.json`;
    // 生成api的目录路径
    const apiDirPath = `${cwdPath}/${cmd.target || cmd.t}/`;
    if (fs.existsSync(apiJsonFilePath)) {
      const apiJson = require(apiJsonFilePath);

      apiBuilder(
        apiDirPath,
        apiName,
        apiJson,
        [cmd.client, cmd.server].filter((env) => !!env)
      );
    } else {
      console.error(chalk.red(`${apiJsonFilePath} 文件不存在`));
    }
  });

commander.parse(process.argv);
