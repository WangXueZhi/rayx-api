# rayx-api
从rayx中剥离出来的api生成命令

# 安装
```
npm install rayx-api -g
```

# 使用

1. 命令：rayx-api c [filename] [dir] [mode]
2. filename：json文件源名称，默认"api"
3. dir：生成到指定目录，选填，如果想指定json文件源名称，该选项为必填，默认"./src/"
4. mode：-O 为重新生成，选填

生成默认api

```node
rayx-api c
```

生成api，覆盖原生成文件，除了fetch.js

```node
rayx-api c -O
```

生成适用于微信小程序的api

```node
rayx-api c --wxa
```

生成到指定目录

```node
rayx-api c ./src/api
```

# tips
1. 项目目录下必须有api.json文件
2. api.json文件由后端生成提供
3. 请求使用axios
