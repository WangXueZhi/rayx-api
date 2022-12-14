_API_ANNOTATION_
const _API_NAME_ = async (req, res) => {
  req.headers.oriUrl = '/_API_PROJECT_/_API_PATH___API_METHOD_UPPER_'
  axiosServerProxy({
    config: {
      method: '_API_METHOD_UPPER_',
      url: `${baseMainurl}/_API_PROJECT_/_API_PATH_`,
      _API_DATA_: req.body,
      headers: req.headers,
    },
    res,
    req,
  })
}
app._API_METHOD_LOWER_('/api/_API_PROJECT_/_API_PATH_', _API_NAME_)
