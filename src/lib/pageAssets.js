function withPageAssets(viewModel = {}, assets = {}) {
  return {
    ...viewModel,
    pageScripts: assets.pageScripts || [],
    pageStyles: assets.pageStyles || []
  };
}

module.exports = { withPageAssets };
