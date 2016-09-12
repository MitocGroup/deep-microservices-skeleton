/**
 * Created by vcernomschi on 9/12/16.
 */

'use strict';

import GitHubPrSubmiter from './GitHubPrSubmiter';
import fsExtra from 'fs-extra';
import path from 'path';
import fs from 'fs';

export default class PullRequestManager {

  /**
   * @param {String} pathToAccess
   * @returns {boolean}
   */
  static accessSync(pathToAccess) {
    try {
      fs.accessSync(pathToAccess, fs.F_OK | fs.R_OK | fs.W_OK);
      return true;
    } catch (exception) {
      return false;
    }
  }

  static get CONFIG_PATH() {
    return path.join(__dirname, 'config.json')
  }

  constructor() {
    this._gitHubPrSubmiter = new GitHubPrSubmiter();

    if (PullRequestManager.accessSync(PullRequestManager.CONFIG_PATH)) {
      let _content = fsExtra.readJsonSync(
        PullRequestManager.CONFIG_PATH, {throws: false}
      );
      this._folderPath = path.join(__dirname, '../../../../', _content.folderPath);
      this._repos = _content.reposArray;
      this._sourceBranchName = _content.sourceBranchName;
      this._destBranchName = _content.destBranchName;
      this._prMessage = _content.prMessage;
    }
  }

  get repos() {
    return this._repos;
  }

  get folderPath() {
    return this._folderPath;
  }

  ensureReposFolderSync() {
    fsExtra.emptyDirSync(this.folderPath);
  }

}

let pullRequestManager = new PullRequestManager();
pullRequestManager.ensureReposFolderSync();
