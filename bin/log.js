var chalk = require('chalk');
var slog = require('single-line-log').stdout;

let log = {}

/**
 * 普通输出
 * @param {String} content 内容
 */
log.info = function (content) {
    console.log(`   ${content}`);
}

/**
 * 成功输出
 * @param {String} content 内容
 */
log.success = function (content) {
    console.log(chalk.green(`   ${content}`));
}

/**
 * 错误输出
 * @param {String} content 内容
 */
log.error = function (content) {
    console.log(chalk.red(content));
}

/**
 * 错误输出
 * @param {String} content 内容
 */
log.progressBar = function (description, bar_length) {
    // 两个基本参数(属性)
    this.description = description || 'Progress';       // 命令行开头的文字信息
    this.length = bar_length || 25;                     // 进度条的长度(单位：字符)，默认设为 25

    // 刷新进度条图案、文字的方法
    this.render = function (opts) {
        var percent = (opts.completed / opts.total).toFixed(4);    // 计算进度(子任务的 完成数 除以 总数)
        var cell_num = Math.floor(percent * this.length);             // 计算需要多少个 █ 符号来拼凑图案

        // 拼接黑色条
        var cell = '';
        for (var i = 0; i < cell_num; i++) {
            cell += chalk.green('█');
        }

        // 拼接灰色条
        var empty = '';
        for (var i = 0; i < this.length - cell_num; i++) {
            empty += chalk.green('░');
        }

        // 拼接最终文本
        var cmdText = chalk.green(this.description) + ' ' + (100 * percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;

        // 在单行输出文本
        slog(cmdText);
    };
}



module.exports = log;