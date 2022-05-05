const util = require("./util.js");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const cwdPath = process.cwd();
const Builder = require('./builder')

/**
 * api模板路径
 */
const TPL_API_PATH = path.resolve(__dirname, "../tpl/api.js");
const TPL_WXA_PATH = path.resolve(__dirname, "../tpl/wxa.js");

/**
 * 解析模板内容
 */
const __TPL_FILE_CONTENT__ = {
  web: TPL_API_PATH,
  wxa: TPL_WXA_PATH,
};

/**
 * 环境配置
 */
const envConfigMap = {};

/**
 * api列表
 */
let apisArr = [];

/**
 * swagger版本
 */
let swaggerVersion = "";

/**
 * 清空
 * @param { String } dir 目录路径
 */
const clean = function (dir) {
  util.rmdirSync(dir);
  fs.mkdirSync(dir);
};

/**
 * 转换swagger2数据
 * @param { Object } data
 * @returns { Object } 转换后的数据
 */
const transformDataForSwagger2 = function (data) {
  let apisArr = [];
  for (const path in data.paths) {
    if (path === "/") {
      continue;
    }
    const item = data.paths[path];
    for (const method in item) {
      item[method].title = item[method].summary;
      if (item[method].consumes) {
        item[method]["Content-Type"] = item[method].consumes[0];
      }
      apisArr.push({
        path,
        method,
        ...item[method],
      });
    }
  }
  return apisArr;
};

/**
 * 转换swagger3数据
 * @param { Object } data
 * @returns { Object } 转换后的数据
 */
const transformDataForSwagger3 = function (data) {
  let apisArr = [];
  data.forEach((item) => {
    if (Array.isArray(item.list)) {
      item.list.forEach((api) => {
        // 提取header中的Content-Type
        if (Array.isArray(api.req_headers)) {
          api.req_headers.forEach((header) => {
            if (header.name === "Content-Type") {
              api["Content-Type"] = header.value;
            }
          });
        }
      });
    }
    apisArr.push(...item.list);
  });
  return apisArr;
};

/**
 * 根据swagger版本转换数据
 * @param { Object } data
 * @returns { Object } 转换后的数据
 */
const transformDataBySwaggerVersion = function (data) {
  if (swaggerVersion === "2.0") {
    // swagger2
    // 转换对象数据为数组数据
    return transformDataForSwagger2(data);
  }
  // swagger3
  return transformDataForSwagger3(data);
};

/**
 * 构建api
 * @param {String} dir 创建目录路径 /src/api/
 * @param {String} apiName api源文件名 api
 * @param {Object} data api数据 json
 * @param {Array} envTypes 生成代码环境类型 []
 */
const builder = function (dir, apiName, data, envTypes) {
  swaggerVersion = data.swagger;

  // 设置_requireHead
  if (fs.existsSync(`${cwdPath}/api.config.json`)) {
    const apiConfig = require(`${cwdPath}/api.config.json`);

    envTypes.forEach((env) => {
      // 相关路径转成绝对路径
      apiConfig[env].tplPath = apiConfig[env].tplPath
        ? path.resolve(`${cwdPath}/${apiConfig[env].tplPath}`)
        : "";
      apiConfig[env].targetPath = apiConfig[env].targetPath
        ? path.resolve(`${cwdPath}/${apiConfig[env].targetPath}`, apiName)
        : "";

      if (apiConfig[env]) {
        if (!apiConfig[env].tplPath || !fs.existsSync(apiConfig[env].tplPath)) {
          console.log(
            chalk.red(`\n  环境 ${env} 缺少 tplPath 配置，或者文件不存在`)
          );
        } else if (!apiConfig[env].targetPath) {
          console.log(chalk.red(`\n  环境 ${env} 缺少 targetPath 配置`));
        } else {
          envConfigMap[env] = apiConfig[env];
          envConfigMap[env].tplContent = fs.readFileSync(
            envConfigMap[env].tplPath,
            "utf-8"
          );
          envConfigMap[env].createdApi = [];
          // envConfigMap[env].apiIndex = 0
          // 先清空目录
          clean(envConfigMap[env].targetPath);
        }
      } else {
        console.log(chalk.red(`\n  环境 ${env} 配置不存在`));
      }
    });
  } else {
    console.error(chalk.red("\n 配置文件api.config.json不存在"));
  }

  // 根据swagger版本转换数据
  apisArr = transformDataBySwaggerVersion(data);
  for (let env in envConfigMap) {
    new Builder({
      config: envConfigMap[env], 
      data: apisArr,
      apiName: apiName,
      type: env
    }).startBuild()
  }
};

module.exports = {
  apiBuilder: builder,
};
