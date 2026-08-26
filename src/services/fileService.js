const prisma = require('../config/db');
const storageService = require('./storageService');
const ApiError = require('../utils/apiError');

function canUploadOrManage(user, project) {
  return (
    user.role === 'ADMIN' ||
    (user.role === 'CLIENT' && project.clientId === user.id) ||
    (user.role === 'EMPLOYEE' && project.assignedUserId === user.id)
  );
}

async function uploadFile(user, project, multerFile, category) {
  if (!canUploadOrManage(user, project)) {
    throw ApiError.forbidden();
  }

  const provider = storageService.getProvider();
  const { storageKey } = await provider.save({
    buffer: multerFile.buffer,
    originalName: multerFile.originalname,
    projectId: project.id,
  });

  return prisma.file.create({
    data: {
      projectId: project.id,
      uploadedBy: user.id,
      fileName: multerFile.originalname,
      fileUrl: storageKey, // clé relative ; le fichier n'est servi que via la route de téléchargement authentifiée
      fileType: multerFile.mimetype,
      fileSize: multerFile.size,
      category: category || null,
    },
  });
}

async function listFiles(project) {
  return prisma.file.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
}

async function findFileOrThrow(project, fileId) {
  const file = await prisma.file.findUnique({ where: { id: Number(fileId) } });
  if (!file || file.projectId !== project.id) {
    throw ApiError.notFound('Fichier introuvable.');
  }
  return file;
}

async function getFileForDownload(project, fileId) {
  const file = await findFileOrThrow(project, fileId);
  const provider = storageService.getProvider();
  const absolutePath = await provider.getAbsolutePath(file.fileUrl);
  return { file, absolutePath };
}

async function deleteFile(user, project, fileId) {
  const file = await findFileOrThrow(project, fileId);

  const canDelete =
    user.role === 'ADMIN' ||
    file.uploadedBy === user.id ||
    (user.role === 'EMPLOYEE' && project.assignedUserId === user.id);

  if (!canDelete) {
    throw ApiError.forbidden();
  }

  const provider = storageService.getProvider();
  await provider.remove(file.fileUrl);
  await prisma.file.delete({ where: { id: file.id } });
}

module.exports = { uploadFile, listFiles, getFileForDownload, deleteFile };
