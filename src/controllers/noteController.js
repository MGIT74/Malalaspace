const asyncHandler = require('../utils/asyncHandler');
const noteService = require('../services/noteService');

const list = asyncHandler(async (req, res) => {
  const notes = await noteService.listNotes(req.user, req.project);
  res.status(200).json({ success: true, data: notes });
});

const create = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user, req.project, req.body.content);
  res.status(201).json({ success: true, data: note });
});

module.exports = { list, create };
