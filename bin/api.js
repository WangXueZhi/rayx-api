const util = require("./util.js");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const cwdPath = process.cwd();
const Builder = require("./builder");
const gulp = require("gulp");

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
 * 删除文件
 * @param { String } dir 目录路径
 */
const rmFile = function (url) {
  if (fs.existsSync(url)) {
    fs.unlinkSync(url);
  }
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
 * @param {Object} data api数据 json
 * options
 * @param {String} root 接口路径根目录
 * @param {String} apiName api源文件名 api
 * @param {Array} envTypes 生成代码环境类型 []
 * @param {Boolean} forceCover 强制覆盖
 * @param {Boolean} ignoreApiNameForUrl 不生成url的api名称
 */
const builder = function (data, options) {
  swaggerVersion = data.swagger;

  const root = options.root
  const apiName = options.apiName || 'api'
  const envTypes = options.envTypes || []
  const forceCover = !!options.forceCover
  const ignoreApiNameForUrl = !!options.ignoreApiNameForUrl

  if (!fs.existsSync(`${cwdPath}/api.config.json`)) {
    console.error(chalk.red("\n 配置文件api.config.json不存在"));
    return;
  }

  const defaultConfig = {
    fileType: "js",
    flatLevel: false
  };

  const apiConfig = require(`${cwdPath}/api.config.json`);  

  for (let i = 0; i < envTypes.length; i++) {
    const env = envTypes[i];
    let currentConfig = apiConfig[env];

    if (!currentConfig) {
      console.log(chalk.red(`\n环境 ${env} 配置不存在`));
      continue;
    }

    currentConfig = { ...defaultConfig, ignoreApiNameForUrlList: apiConfig.ignoreApiNameForUrlList, ...currentConfig };

    // 相关路径转成绝对路径
    currentConfig.tplPath = currentConfig.tplPath
      ? path.resolve(`${cwdPath}/${currentConfig.tplPath}`)
      : "";
    currentConfig.targetPath = currentConfig.targetPath
      ? path.resolve(
          `${cwdPath}/${currentConfig.targetPath}`,
          !currentConfig.flatLevel ? apiName : ""
        )
      : "";
    currentConfig.layoutPath = currentConfig.layoutPath
      ? path.resolve(`${cwdPath}/${currentConfig.layoutPath}`)
      : "";
    currentConfig.fnNameWithMethod =
      currentConfig.fnNameWithMethod || apiConfig.fnNameWithMethod || false;

    if (!currentConfig.tplPath || !fs.existsSync(currentConfig.tplPath)) {
      console.log(chalk.red(`\n环境 ${env} 缺少 tplPath 配置，或者文件不存在`));
    } else if (!currentConfig.targetPath) {
      console.log(chalk.red(`\n环境 ${env} 缺少 targetPath 配置`));
    } else {
      envConfigMap[env] = currentConfig;
      envConfigMap[env].tplContent = fs.readFileSync(
        envConfigMap[env].tplPath,
        "utf-8"
      );
      envConfigMap[env].layoutContent = envConfigMap[env].layoutPath
        ? fs.readFileSync(envConfigMap[env].layoutPath, "utf-8")
        : "";
      envConfigMap[env].createdApi = [];
      // envConfigMap[env].apiIndex = 0
      // 先清空目录
      const targetPath = currentConfig.flatLevel
        ? `${envConfigMap[env].targetPath}/${apiName}.${currentConfig.fileType}`
        : envConfigMap[env].targetPath;
      if (
        ((currentConfig.flatLevel && fs.existsSync(targetPath)) ||
          (util.dirExists(targetPath) && !util.isDirEmpty(targetPath))) &&
        !forceCover
      ) {
        console.log(
          chalk.red(
            `目录已存在 -> ${envConfigMap[env].targetPath}，可使用 --force 或者 --f 进行强制删除并重新创建`
          )
        );
        return;
      }
      if (currentConfig.flatLevel) {
        rmFile(targetPath);
      } else {
        clean(targetPath);
        gulp
          .src(path.resolve(__dirname, `../tpl/index.${currentConfig.fileType}`))
          .pipe(gulp.dest(targetPath));
      }
    }
  }

  // 根据swagger版本转换数据
  apisArr = transformDataBySwaggerVersion(data);
  for (let env in envConfigMap) {
    new Builder({
      config: envConfigMap[env],
      data: apisArr,
      apiName: apiName,
      type: env,
      root,
      ignoreApiNameForUrl
    }).startBuild();
  }
};

module.exports = {
  apiBuilder: builder,
};
