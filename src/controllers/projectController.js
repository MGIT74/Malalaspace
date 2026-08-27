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

const assign = asyncHandler(async (req, res) => {
  const project = await projectService.assignProject(req.user, req.params.id, req.body.employeeId);
  res.status(200).json({ success: true, data: project });
});

const createForClient = asyncHandler(async (req, res) => {
  const { clientId, ...data } = req.body;
  const project = await projectService.createProjectForClient(req.user, clientId, data);
  res.status(201).json({ success: true, data: project });
});

const remove = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.user, req.params.id);
  res.status(200).json({ success: true, message: 'Projet supprimé.' });
});

const updateDeadline = asyncHandler(async (req, res) => {
  const project = await projectService.updateDeadline(req.user, req.params.id, req.body.deadline);
  res.status(200).json({ success: true, data: project });
});

module.exports = { list, create, getById, assign, createForClient, remove, updateDeadline };
