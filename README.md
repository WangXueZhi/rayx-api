# rayx-api
从rayx中剥离出来的api生成命令

# 安装
```
npm install rayx-api -g
```

# 使用

1. 基础命令：rayx-api [filename] [dir]
2. filename：json文件源名称，默认"api"，选填，如果需要指定api生成路径，该选项必须先填写
3. dir：生成到指定目录，选填，默认"./src/"
4. 选项：-o，重新生成，会覆盖原生成文件，除了fetch.js； -v，帮助

生成默认api

```node
rayx-api
```

生成api，覆盖原生成文件，除了fetch.js

```node
rayx-api -O
```

生成适用于微信小程序的api

```node
rayx-api --wxa
```

生成到指定目录，必须先指定json文件源名称

```node
rayx-api homeApi ./src/api/
```

# tips
1. 项目目录下必须有api.json接口配置文件，或者其他名字的json配置文件
2. api.json文件由后端生成提供
3. 请求使用的是axios
