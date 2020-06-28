__api_annotation__
export function __api_name__(options) {
  return fetch({
    url: __url__,
    method: __method__,
    headers: {__headers__, ...(options && options.headers ? options.headers : {})},
    data: (options && options.data) || {}
  })
}