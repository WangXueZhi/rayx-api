#!/usr/bin/env node
const pkg = require("../package.json");
const cwdPath = process.cwd();
const fs = require("fs");
const commander = require('commander');
const chalk = require('chalk')
const {
    apiBuilder
  } = require('./api')


commander.version(pkg.version).description('api代码生成工具')

// api操作
commander
  .description('api代码生成工具')
  .option("--source <source>", "数据源")
  .option("--s <source>", "数据源")
  .option("--target <target>", "生成目标目录")
  .option("--t <target>", "生成目标目录")
  .option("--wxa", "微信小程序")
  .action(function (cmd) {
    if(!cmd.target && !cmd.t){
      console.error(chalk.red('必须指定生成代码的目标目录'));
      return
    }
    
    // api源文件名
    const apiName = cmd.source || cmd.s || "api";
    // api源文件路径
    const apiJsonFilePath = `${cwdPath}/${apiName}.json`;
    // 生成api的目录路径
    const apiDirPath = `${cwdPath}/${cmd.target || cmd.t}/`
    if (fs.existsSync(apiJsonFilePath)) {
      const apiJson = require(apiJsonFilePath);
      apiBuilder(apiDirPath, apiName, apiJson, !!cmd.wxa);
    } else {
      console.error(chalk.red(`${apiJsonFilePath} 文件不存在`));
    }
  });

commander.parse(process.argv)