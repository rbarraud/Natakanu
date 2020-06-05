import { dialog } from 'electron';
import {
  parse as parsePath,
  join as joinPaths,
  basename as pathBasename
} from 'path';
import fs from 'fs-extra';
import pump from 'pump-promise';
import readdir from 'readdir-enhanced';

import { encodeProject } from './urlParser';
import { PROJECT_INFO_FILE } from '../constants/core';

export default class Project {
  static async load(key, Hyperdrive, database) {
    const project = new Project(key, Hyperdrive, database);

    await project.init();

    return project;
  }

  constructor(key, Hyperdrive, database) {
    this.key = key;
    this.Hyperdrive = Hyperdrive;
    this.database = database;
    this.isDownloading = null;
  }

  get url() {
    return encodeProject(this.archive.key);
  }

  get writable() {
    return this.archive.writable;
  }

  async init() {
    this.archive = this.Hyperdrive(this.key);

    await this.archive.ready();

    const isSaved = await this.isSaved();
    const { writable } = this;

    const shouldDownload = !writable && isSaved;

    if (shouldDownload) {
      this.startDownloading();
    }
  }

  async getInfo() {
    const key = this.key.toString('hex');
    const { url } = this;
    const { writable } = this.archive;
    const isSaved = await this.isSaved();
    try {
      const raw = await this.archive.readFile(PROJECT_INFO_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      const final = { title: key, ...parsed, key, url, writable, isSaved };
      return final;
    } catch (e) {
      return { title: key, key, url, writable, isSaved };
    }
  }

  async updateInfo(info) {
    const existing = await this.getInfo();

    const updated = { ...existing, ...info };

    const stringified = JSON.stringify(updated, null, '\t');

    await this.archive.writeFile(PROJECT_INFO_FILE, stringified);

    return updated;
  }

  async isSaved() {
    const { url, writable } = this;

    if (writable) return true;
    const saved = await this.database.getSavedProjectNames();

    return saved.includes(url);
  }

  async setSaved(saved) {
    const { url, writable } = this;

    if (writable) return;

    if (saved) {
      await this.database.addSavedProjectName(url);
      this.startDownloading();
    } else {
      await this.database.removeSavedProjectName(url);
      this.stopDownloading();
    }
  }

  startDownloading() {
    if (this.isDownloading) return;
    this.isDownloading = () => this.archive.download('/');
    this.archive.on('update', this.isDownloading);
    this.isDownloading();
  }

  stopDownloading() {
    if (!this.isDownloading) return;
    this.archive.removeListener(this.isDownloading);
    this.isDownloading = null;
  }

  async getFileList(path = '/') {
    return this.archive.readdir(path, { includeStats: true });
  }

  async deleteFile(path) {
    return this.archive.unlink(path);
  }

  async showSaveFile(path) {
    const { base: defaultPath } = parsePath(path);
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath
    });

    if (canceled) throw new Error('Canceled file save');

    const readStream = this.archive.createReadStream(path);
    const writeStream = fs.createWriteStream(filePath);

    await pump(readStream, writeStream);

    return {
      filePath
    };
  }

  async showLoadFile(basePath = '/') {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      // properties: ['openFile', 'openDirectory', 'multiSelections']
    });

    // If they cancelled, whatever
    if (canceled) return { filePaths: [] };

    for (const filePath of filePaths) {
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        const folderName = pathBasename(filePath);
        const searchOpts = {
          deep: true,
          filter: stats => stats.isFile()
        };
        for await (const subpath of readdir.iterator(filePath, searchOpts)) {
          const destination = joinPaths(basePath, folderName, subpath);
          const source = joinPaths(filePath, subpath);

          await this.saveFromFS(source, destination);
        }
      } else {
        const { base: fileName } = parsePath(filePath);
        const destination = joinPaths(basePath, fileName);
        await this.saveFromFS(filePath, destination);
      }
    }

    return {
      filePaths
    };
  }

  async saveFromFS(fsFile, destinationFile) {
    const writeStream = this.archive.createWriteStream(destinationFile);
    const readStream = fs.createReadStream(fsFile);

    await pump(readStream, writeStream);
  }
}
