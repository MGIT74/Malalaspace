const asyncHandler = require('../utils/asyncHandler');
const brandAssetService = require('../services/brandAssetService');

const get = asyncHandler(async (req, res) => {
  const brandAsset = await brandAssetService.getBrandAsset(req.project);
  res.status(200).json({ success: true, data: brandAsset });
});

const updateColors = asyncHandler(async (req, res) => {
  const brandAsset = await brandAssetService.upsertColors(req.user, req.project, req.body.colors);
  res.status(200).json({ success: true, data: brandAsset });
});

module.exports = { get, updateColors };
