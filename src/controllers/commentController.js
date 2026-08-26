const asyncHandler = require('../utils/asyncHandler');
const commentService = require('../services/commentService');

const list = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(req.project);
  res.status(200).json({ success: true, data: comments });
});

const create = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.user, req.project, req.body);
  res.status(201).json({ success: true, data: comment });
});

const updateStatus = asyncHandler(async (req, res) => {
  const comment = await commentService.updateCommentStatus(req.user, req.project, req.params.commentId, req.body.status);
  res.status(200).json({ success: true, data: comment });
});

module.exports = { list, create, updateStatus };
