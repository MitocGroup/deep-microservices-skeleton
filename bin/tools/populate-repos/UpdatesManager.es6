/**
 * Created by vcernomschi on 9/12/16.
 */

'use strict';

import GitHubPrSubmiter from './GitHubPrSubmiter';
import NodeGit from 'nodegit';
import fsExtra from 'fs-extra';
import path from 'path';
import fs from 'fs';
import ChildProcess from 'child_process';
import {Output} from './../Helper/Output';

export default class UpdatesManager {

  /**
   * @returns {String}
   * @constructor
   */
  static get Auth0Token() {
    return process.env['GITHUB_OAUTH_TOKEN'];
  }

  /**
   * @returns {Boolean}
   */
  static get isEnvVarsAdded() {
    return (typeof process.env['GITHUB_OAUTH_TOKEN'] === 'string' && process.env['GITHUB_OAUTH_TOKEN'].length > 1) &&
      (typeof process.env['NO_INTERACTION'] === 'string' && process.env['NO_INTERACTION'] === '1');
  }

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

  /**
   * @returns {String}
   * @constructor
   */
  static get CONFIG_PATH() {
    return path.join(__dirname, 'config.json')
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get REPOSITORY_UPDATE() {
    return 'deep-microservices-skeleton/bin/tools/repository_update.sh';
  }

  /**
   * @param {String} repo
   * @returns {String}
   */
  static getRepoName(repoUrl) {
    return repoUrl.replace(/.*\/(.*)/i, '$1');
  }

  /**
   * @param {String} repo
   * @returns {String}
   */
  static getRepoUser(repoUrl) {
    return repoUrl.replace(/(git@|ssh|http(s)?:(\/\/))github.com(\/|:)((.*))\/.*(\.git)?(\/)?/i, '$5');
  }

  constructor() {
    if (!UpdatesManager.isEnvVarsAdded) {
      console.error(`<error>No all environment variables configured:</error>`);
      console.log(`Run from terminal: <warn>export NO_INTERACTION=1 && export GITHUB_OAUTH_TOKEN=YOUR_TOKEN</warn>`);
      throw Error('No all env var configured');
    }
    else if (UpdatesManager.accessSync(UpdatesManager.CONFIG_PATH)) {
      let _content = fsExtra.readJsonSync(
        UpdatesManager.CONFIG_PATH, {throws: false}
      );
      this._folderPath = path.join(__dirname, '../../../../', _content.folderPath);
      this._repos = _content.reposArray;
      this._sourceBranchName = _content.sourceBranchName;
      this._destBranchName = _content.destBranchName;
      this._commitMessage = _content.commitMessage;
      this._pullRequestMessage = (typeof _content.pullRequestMessage === 'undefined' ||
      _content.pullRequestMessage === '') ? _content.commitMessage : _content.pullRequestMessage;
    } else {
      console.error(`<error>No config file:</error> ${UpdatesManager.CONFIG_PATH}`);
      throw Error('No config file');
    }
    this._gitHubPrSubmiter = new GitHubPrSubmiter();
  }

  /**
   * @returns {String}
   */
  get destBranchName() {
    return this._destBranchName;
  }

  /**
   * @returns {String[]}
   */
  get repos() {
    return this._repos;
  }

  /**
   * @returns {String}
   */
  get folderPath() {
    return this._folderPath;
  }

  /**
   * @returns {String}
   */
  get sourceBranchName() {
    return this._sourceBranchName;
  }

  /**
   * @returns {String}
   */
  get commitMessage() {
    return this._commitMessage;
  }

  /**
   * @returns {String}
   */
  get pullRequestMessage() {
    return this._pullRequestMessage;
  }

  /**
   * @returns {Object}
   */
  get cloneOptions() {
    var cloneOptions = {
      checkoutBranch: this.sourceBranchName,
      fetchOpts: {
        callbacks: {
          certificateCheck: function () {
            return 1;
          },
          credentials: function () {
            return NodeGit.Cred.userpassPlaintextNew(UpdatesManager.Auth0Token, 'x-oauth-basic');
          }
        }
      },
    };

    return cloneOptions;
  }

  /**
   * @returns {GitHubMsgPublisher}
   */
  get gitHubPrSubmiter() {
    return this._gitHubPrSubmiter;
  }

  /**
   * Prepares folder for repos
   */
  _ensureReposFolderSync() {
    fsExtra.emptyDirSync(this.folderPath);
  }

  /**
   * @param {String} repoUrl
   * @param {String} localPth
   * @param {Object} cloneOptions
   */
  cloneRepo(repoUrl, localPth, cloneOptions) {
    var promise = new Promise((resolve, reject) => {
      NodeGit.Clone(repoUrl, localPth, cloneOptions).then(
        (repository) => resolve(repository),
        (error) => reject(error)
      );
    });

    return promise;
  }

  /**
   * @param {Object} repo
   * @param {String} branchName
   * @param {String} logMsg
   * @returns {Promise}
   */
  createDestinationBranch(repo, branchName, logMsg) {
    var promise = new Promise((resolve, reject) => {

      // Create a new branch on head
      repo.getHeadCommit()
        .then(function (commit) {
          return repo.createBranch(
            branchName,
            commit,
            0,
            repo.defaultSignature(),
            logMsg);
        }).done(function () {
          resolve(branchName);
        });
    });

    return promise;
  }

  /**
   * @param {String} repoPath
   * @param {String} branchName
   * @returns {Promise}
   */
  changeToDestBranch(repoPath, branchName) {
    var promise = new Promise((resolve, reject) => {
      NodeGit.Repository.open(path.resolve(repoPath, './.git'))
        .then(function (repo) {

          // Create a new branch on head
          return repo.getBranch(branchName)
            .then(function (reference) {

              //checkout branch
              return repo.checkoutRef(reference);
            });

        }).done(function () {
          resolve(repoPath);
        });
    });

    return promise;
  }

  /**
   * @param {Object} repo
   * @param {String} branchName
   * @returns {Promise}
   */
  changeDestinationBranch(repo, branchName) {
    var promise = new Promise((resolve, reject) => {

      // Create a new branch on head
      repo.getBranch(branchName)
        .then(function (reference) {

          //checkout branch
          return repo.checkoutRef(reference);
        }).done(function () {
          resolve(branchName);
        });
    });

    return promise;
  }

  /**
   * @param {String} repoPath
   * @param {String} commitMsg
   * @param {String} destBranchName
   * @returns {Promise}
   */
  pushChanges(localRepoPath, commitMsg, destBranchName) {
    var repo, index, paths = [], remote;

    var promise = new Promise((resolve, reject) => {
      NodeGit.Repository.open(path.join(localRepoPath, './.git'))
        .then((repoResult) => {
          repo = repoResult;
          return repoResult.index();
        })
        .then((indexResult) => {
          index = indexResult;
          index.read(1);
          paths = [];

          return NodeGit.Status.foreach(repo, (filePath) => {
            paths.push(filePath);
          }).then(() => {
            return Promise.resolve(paths);
          });
        })
        .then((paths) => {

          // this file is in the root of the directory and doesn't need a full path
          index.addAll(paths);
        })
        .then(() => {
          var defSign = repo.defaultSignature();
          return repo.createCommitOnHead(
            paths, defSign, defSign, commitMsg);
        }).then(function (oid) {
          return console.log('New Commit: ', oid);
        })
        /// PUSH
        .then(function () {
          return repo.getRemote('origin');
        }).then(function (remoteResult) {

          remote = remoteResult;

          // Create the push object for this remote
          return remote.push(
            [`refs/heads/${destBranchName}:refs/heads/${destBranchName}`],
            {
              callbacks: {
                credentials: function () {
                  return NodeGit.Cred.userpassPlaintextNew(UpdatesManager.Auth0Token, 'x-oauth-basic');
                }
              }
            }
          );
        })
        .catch(function (reason) {
          console.log(reason);
          reject(reason)
        })
        .done(function () {
          resolve('Committed and pushed');
        });
    });

    return promise;
  }

  /**
   * @param {String} localRepoPath
   * @returns {Promise}
   */
  updateBranch(localRepoPath) {

    var promise = new Promise((resolve, reject) => {

      let cwd = path.join(__dirname, '../../../../');
      let fullCmd = `${UpdatesManager.REPOSITORY_UPDATE} ${localRepoPath}`;

      this._exec(fullCmd, cwd).then(
          cmdResult => resolve(cmdResult),
          cmdError => reject(cmdError)
      )
    });

    return promise;
  }

  /**
   * @param {String} fullCmd
   * @param {String} cwd
   * @returns {Promise}
   * @private
   */
  _exec(fullCmd, cwd) {
    var promise = new Promise((resolve, reject) => {
      ChildProcess.exec(fullCmd, {
        cwd: cwd,
      }, (error, stdout) => {
        if (error) {
          reject(`Command '${fullCmd}' failed in '${cwd}' with error: ${error}`);
        } else {
          let result = stdout ? stdout.toString().trim() : null;
          resolve(result);
        }
      });
    });

    return promise;
  }

  /**
   * @returns {Promise}
   */
  updateRepos() {

    this._ensureReposFolderSync();

    var promises = [];
    var repo;
    var self = this;

    for (let repoUrl of this.repos) {

      console.log('Updating repoUrl: ', repoUrl);

      let localRepoPath = path.join(this.folderPath, UpdatesManager.getRepoName(repoUrl));
      promises.push(
        self.cloneRepo(repoUrl, localRepoPath, this.cloneOptions)
          .then((repoResult) => {
            repo = repoResult;
          })
          .then(() => {
            return self.createDestinationBranch(repo, self.destBranchName);
          })
          .then(() => {
            return self.changeDestinationBranch(repo, self.destBranchName);
          })
          .then(() => {
            return self.updateBranch(localRepoPath);
          })
          .then(() => {
            return self.pushChanges(localRepoPath, self.commitMessage, self.destBranchName);
          })
          .then(() => {
            return self.gitHubPrSubmiter.createPullRequest(
              UpdatesManager.getRepoUser(repoUrl),
              UpdatesManager.getRepoName(repoUrl),
              self.pullRequestMessage,
              self.destBranchName,
              self.sourceBranchName
            )
          })
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        (data) => resolve('Done:', data)
      ).catch(
        (err) => reject(err)
      );
    });

    return promise;
  }
}
Output.overwriteConsole().overwriteStdout();

let updatesManager = new UpdatesManager();
updatesManager.updateRepos()
  .then(
  (result) => {
    console.log(result)
  },
  (err) => {
    console.error(err)
  });
