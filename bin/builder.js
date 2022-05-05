const util = require("./util.js");
const fs = require("fs");
const gulp = require("gulp");
const replace = require("gulp-replace");
const rename = require("gulp-rename");
const prependFile = require("prepend-file");
const ProgressBar = require("progress");
const chalk = require("chalk");
const slog = require("single-line-log").stdout;

const __KEYWORDS__ = [
  "abstract",
  "arguments",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "eval",
  "export",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "function",
  "goto",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "int",
  "interface",
  "let",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "volatile",
  "while",
  "with",
  "yield",
];

class Builder {
  constructor(options) {
    this.config = options.config;
    this.apisArr = options.data;
    this.apiName = options.apiName;
    this.type = options.type;
    this.bar = new ProgressBar(`${options.type} [:bar] :current/:total`, {
      complete: "=",
      incomplete: " ",
      width: 20,
      total: this.apisArr.length,
    });
  }

  apiIndex = 0;

  startBuild() {
    this.buildOne(this.apisArr[this.apiIndex]);
  }
  /**
   * 生成指定接口api
   * @param {Object} data
   */
  buildOne(data) {
    // 处理url数据
    // 待生成的接口
    let urlArr = util.cleanEmptyInArray(data.path.split("/"));

    // 文件生成目录
    let apiTargetPath = this.config.targetPath;

    // 拼接出文件路径
    for (let i = 0; i < urlArr.length - 2; i++) {
      apiTargetPath += `/${urlArr[i]}`;
    }

    // 创建api方法名
    let apiFunName = urlArr[urlArr.length - 1];

    // 判断是否是rest风格接口
    apiFunName =
      apiFunName.indexOf("{") >= 0
        ? apiFunName.slice(1, apiFunName.length - 1)
        : apiFunName;

    const API_METHOD = `${data.method || "post"}`;
    const API_DATA_TYPE = API_METHOD.toUpperCase() === "GET" ? "params" : "data";
    const API_NAME =
      (__KEYWORDS__.includes(apiFunName) ? `_${apiFunName}` : apiFunName) +
      `_${data.method || "post"}`;
    const api_describe = data.title;
    const API_dESCRIBE = api_describe
      .split("\n")
      .map((item) => item.trim())
      .join("\n");
    const API_URL = `${util.cleanEmptyInArray(data.path.split("/")).join("/")}`;
    // const API_HEADER = data["Content-Type"]
    //   ? `{ 'Content-Type': '${data["Content-Type"]}', ...(options && options.headers ? options.headers : {}) }`
    //   : "options && options.headers ? options.headers : {}";
    const API_HEADER = "options && options.headers ? options.headers : {}";

    // 命名接口文件名称
    let apiFileName = urlArr[urlArr.length - 2] || "other";
    apiFileName =
      apiFileName.indexOf("{") >= 0
        ? apiFileName.slice(1, apiFileName.length - 1)
        : apiFileName;
    apiFileName += ".js";

    // 处理方法注释
    const paramString = this.parseParamToAnnotation(API_METHOD, data);
    const AnnotationString = `/**\n* ${API_dESCRIBE}\n${paramString}*/`;

    // 目标文件路径
    let targetApiFilePath = `${apiTargetPath}/${apiFileName}`;

    if (fs.existsSync(targetApiFilePath)) {
      // 检查是否已经存在该接口
      if (this.checkIsCreate(this.config.createdApi, API_URL, API_METHOD)) {
        console.log(chalk.red(`\n  ${API_URL}已存在...继续创建下一个api`));
        this.bar.tick(1);
        this.buildNext();
        return;
      }

      // 替换模板内容
      let newTplFileContent = this.config.tplContent
        .replace(/__API_ANNOTATION__/g, AnnotationString)
        .replace(/_API_NAME_/g, API_NAME)
        .replace(/_API_PATH_/g, API_URL)
        .replace(/_API_METHOD_/g, API_METHOD)
        .replace(/_API_PROJECT_/g, this.apiName)
        .replace(/_API_DATA_/g, API_DATA_TYPE)
        .replace(/_API_HEADERS_/g, API_HEADER);

      // 写入新内容
      try {
        fs.appendFileSync(targetApiFilePath, `\n${newTplFileContent}`, "utf8");
        this.config.createdApi.push(API_URL + "_" + API_METHOD);
        this.bar.tick(1);
      } catch (error) {
        console.error(chalk.red(`api ${API_NAME} 创建失败，原因：${error}`));
        return;
      }

      this.buildNext();
    } else {
      // 如果目标文件不存在， 创建目标文件
      gulp
        .src(this.config.tplPath)
        .pipe(rename(apiFileName))
        .pipe(replace("__API_ANNOTATION__", AnnotationString))
        .pipe(replace("_API_NAME_", API_NAME))
        .pipe(replace("_API_PATH_", API_URL))
        .pipe(replace("_API_METHOD_", API_METHOD))
        .pipe(replace("_API_PROJECT_", this.apiName))
        .pipe(replace("_API_DATA_", API_DATA_TYPE))
        .pipe(replace("_API_HEADERS_", API_HEADER))
        .pipe(gulp.dest(apiTargetPath))
        .on("end", () => {
          this.config.createdApi.push(API_URL + "_" + API_METHOD);
          prependFile(
            targetApiFilePath,
            this.config.requireHead || "",
            (err) => {
              if (err) {
                // Error
              }
              // Success
              this.bar.tick(1);
              this.buildNext();
            }
          );
        });
    }
  }

  /**
   * 构建下一个api
   */
  buildNext() {
    if (this.bar.complete) {
      //   let cmdText = chalk.green(`${this.apiName} 生成完毕\n`);
      //   console.log(cmdText);
      return;
    }
    this.apiIndex++;
    if (this.apisArr[this.apiIndex]) {
      this.buildOne(this.apisArr[this.apiIndex]);
    }
  }

  /**
   * 检查当前api是否已被生成
   * @param {*} pathArr 已生成的api数组
   * @param {*} path 接口路径
   * @param { String } method 接口方法
   */
  checkIsCreate(pathArr, path, method) {
    return pathArr.includes(path + "_" + method);
  }

  /**
   * 解析参数成注释字符串
   * @param {string} method 方法名
   * @param {object} data 接口数据
   */
  parseParamToAnnotation(method, data) {
    let paramList = [];
    let paramString = "";
    if (method.toUpperCase === "GET") {
      paramList = data.req_query;
    } else {
      paramList = data.req_body_form;
    }
    if (paramList.length > 0) {
      paramString += `* @property {Object} options.data 接口参数\n`;
    }
    paramList.forEach((param) => {
      paramString += `* @property {${param.type}} options.data.${param.name} ${param.desc}\n`;
    });
    return paramString;
  }
}

module.exports = Builder;
