const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/projectService');

const list = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user);
  res.status(200).json({ success: true, data: projects });
});

const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user, req.body);
  res.status(201).json({ success: true, data: project });
});

const getById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectForUser(req.user, req.params.id);
  res.status(200).json({ success: true, data: project });
});

module.exports = { list, create, getById };
