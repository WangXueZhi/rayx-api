__api_annotation__
exports.__api_name__ = function (options) {
  return network.request({
    url: __url__,
    method: __method__,
    headers: {__headers__, ...(options && options.headers ? options.headers : {})},
    data: (options && options.data) || {}
  })
}
