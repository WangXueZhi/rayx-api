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
  .option("--root <source>", "接口路径根目录")
  .option("--client", "客户端代码")
  .option("--mock", "mock代码")
  .option("--force", "强制覆盖")
  .option("--f", "强制覆盖")
  .option("--ignore-api-name-for-url", "不生成url的api名称")
  .action(function (cmd) {
    const sourcePath = cmd.source || cmd.s || "api";
    if(!sourcePath){
      console.error(chalk.red('必须指定 --source 或者 --s'));
    }
    // 强制覆盖
    const forceCover = cmd.force || cmd.f || false;
    // api源文件名
    const sourcePathArr = sourcePath.split("/");
    const apiName = sourcePathArr[sourcePathArr.length - 1];
    // api源文件路径
    const apiJsonFilePath = `${cwdPath}/${sourcePath}.json`;
    // 生成api的目录路径
    const root = cmd.root || sourcePathArr[sourcePathArr.length - 1];
    if (fs.existsSync(apiJsonFilePath)) {
      const apiJson = require(apiJsonFilePath);
      apiBuilder(apiJson, {
        root,
        apiName,
        envTypes: [
          cmd.client && "client",
          cmd.server && "server",
          cmd.mock && "mock",
        ].filter((env) => !!env),
        forceCover,
        ignoreApiNameForUrl: !!cmd.ignoreApiNameForUrl
      });
    } else {
      console.error(chalk.red(`${apiJsonFilePath} 文件不存在`));
    }
  });

commander.parse(process.argv);
