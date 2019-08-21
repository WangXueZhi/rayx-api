#!/usr/bin/env node
const pkg = require("../package.json");
const cwdPath = process.cwd();
const path = require('path');
const fs = require("fs");
var program = require('commander');
const log = require("./log.js");
const api = require("./api.js");


// program
//     // 版本号
//     .version(pkg.version)
//     .option('-v', '版本号', function () {
//         console.log(pkg.version)
//     });

program
    .description('生成api接口文件')
    .version(pkg.version)
    .option('-v, -V', '版本号', function () {
        console.log(pkg.version)
    })
    .option("-o, -O", "覆盖")
    .option("--wxa", "小程序")
    .action(function (name, dir, options) {
        // api源文件名
        const apiName = typeof name == "string" ? name : "api";
        // api源文件路径
        const apiJsonFilePath = `${cwdPath}/${apiName}.json`;
        // 生成api的目录路径，默认./src
        const apiDirPath = dir && typeof dir == "string" ? `${path.resolve(cwdPath, dir)}/${apiName}/` : `${cwdPath}/src/${apiName}/`;

        const config = (typeof name == "object" && name) || (typeof dir == "object" && dir) || (typeof options == "object" && options) || {};

        const isOverride = !!config.O;

        if (fs.existsSync(apiJsonFilePath)) {
            const apiJson = require(apiJsonFilePath);
            if (!!config.wxa) {
                api.buildWXA(apiDirPath, apiName, apiJson, isOverride);
            } else {
                api.build(apiDirPath, apiName, apiJson, isOverride);
            }
        } else {
            log.error(`${apiJsonFilePath} 文件不存在`);
        }
    });

program.parse(process.argv)