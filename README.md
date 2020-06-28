# rayx-api
以swagger导出的json文件作为数据源，自动化生成接口调用代码，支持swagger2和swagger3的数据源

### 安装
```
npm install rayx-api -g
```

### 使用

1. 基础命令：rayx-api --source=[source] --target=[target] --wxa
2. source：json文件源名称，默认"api"
3. target: 生成代码的目标目录，必填
4. wxa：生成适用于微信小程序的代码

### example

```
rayx-api --source=api --target=src/api
```
