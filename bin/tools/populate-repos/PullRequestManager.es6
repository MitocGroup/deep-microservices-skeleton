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

export default class PullRequestManager {

  /**
   * @returns {String}
   * @constructor
   */
  static get Auth0Token() {
    return process.env['GITHUB_OAUTH_TOKEN'];
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
   * @returns {string}
   * @constructor
   */
  static get CONFIG_PATH() {
    return path.join(__dirname, 'config.json')
  }

  static get REPOSITORY_UPDATE() {
    return 'deep-microservices-skeleton/bin/tools/repository_update.sh';
  }

  /**
   * @param {String} repo
   * @returns {String}
   */
  static getRepoName(repo) {
    return repo.replace(/.*\/(.*)/i, '$1');
  }

  /**
   * @param {String} repo
   * @returns {String}
   */
  static getRepoUser(repo) {
    return repo.replace(/(git@|ssh|http(s)?:(\/\/))github.com(\/|:)((.*))\/.*(\.git)?(\/)?/i, '$5');
  }

  constructor() {
    this._gitHubPrSubmiter = new GitHubPrSubmiter();

    //todo - 1. add absent config msg
    //todo - 2. no env var msg
    if (PullRequestManager.accessSync(PullRequestManager.CONFIG_PATH)) {
      let _content = fsExtra.readJsonSync(
        PullRequestManager.CONFIG_PATH, {throws: false}
      );
      this._folderPath = path.join(__dirname, '../../../../', _content.folderPath);
      this._repos = _content.reposArray;
      this._sourceBranchName = _content.sourceBranchName;
      this._destBranchName = _content.destBranchName;
      this._commitMessage = _content.commitMessage;
      this._pullRequestMessage = (typeof _content.pullRequestMessage === 'undefined' ||
      _content.pullRequestMessage === '') ? _content.commitMessage : _content.pullRequestMessage;
    }
  }

  /**
   * @returns {String[]}
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
            return NodeGit.Cred.userpassPlaintextNew(PullRequestManager.Auth0Token, 'x-oauth-basic');
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
  ensureReposFolderSync() {
    fsExtra.emptyDirSync(this.folderPath);
  }

  /**
   * @returns {Promise}
   */
  copyRepos() {
    var promises = [];

    for (let repo of this.repos) {
      promises.push(
        NodeGit.Clone(repo, path.join(this.folderPath, PullRequestManager.getRepoName(repo)), this.cloneOptions)
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        () => resolve('cloned repositories')
      ).catch(
        (err) => reject(err)
      );
    });

    return promise;
  }

  /**
   * @returns {Promise}
   */
  createDestBranches() {
    var promises = [];

    for (let repo of this.repos) {
      promises.push(
        this.createDestBranch(path.join(this.folderPath, PullRequestManager.getRepoName(repo)), this.destBranchName, 'Msg here')
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        () => resolve('created dest repositories')
      ).catch(
        (err) => reject(err)
      );
    });

    return promise;
  }

  /**
   * @param {String} repoPath
   * @param {String} branchName
   * @param {String} logMsg
   * @returns {Promise}
   */
  createDestBranch(repoPath, branchName, logMsg) {
    var promise = new Promise((resolve, reject) => {
      NodeGit.Repository.open(path.resolve(repoPath, './.git'))
        .then(function (repo) {

          // Create a new branch on head
          return repo.getHeadCommit()
            .then(function (commit) {
              return repo.createBranch(
                branchName,
                commit,
                0,
                repo.defaultSignature(),
                logMsg);
            });

        }).done(function () {
          resolve(repoPath);
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
   * @param {String} repoPath
   * @param {String} commitMsg
   * @param {String} destBranchName
   * @returns {Promise}
   */
  addChangesAndCommit(repoPath, commitMsg, destBranchName) {
    var repo, index, paths = [], remote;

    var promise = new Promise((resolve, reject) => {
      NodeGit.Repository.open(path.join(repoPath, './.git'))
        .then((repoResult) => {
          repo = repoResult;
          return repoResult.index();
        })
        .then(function (indexResult) {
          index = indexResult;
          index.read(1);
          paths = [];

          return NodeGit.Status.foreach(repo, function (filePath) {
            paths.push(filePath);
          }).then(function () {
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
                  return NodeGit.Cred.userpassPlaintextNew(PullRequestManager.Auth0Token, 'x-oauth-basic');
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


  changeToDestBranches() {
    var promises = [];

    for (let repo of this.repos) {
      promises.push(
        this.changeToDestBranch(path.join(this.folderPath, PullRequestManager.getRepoName(repo)), this.destBranchName)
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        () => resolve('switched to dest repositories')
      ).catch(
        (err) => reject(err)
      );
    });

    return promise;
  }

  commitChanges() {
    var promises = [];

    for (let repo of this.repos) {
      promises.push(
        this.addChangesAndCommit(path.join(this.folderPath, PullRequestManager.getRepoName(repo)), this.commitMessage, this.destBranchName)
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        () => resolve('added changes')
      ).catch(
        (err) => reject(err)
      );
    });

    return promise;
  }

  updateBranches() {
    var promises = [];

    for (let repo of this.repos) {
      let repoPath = path.join(this.folderPath, PullRequestManager.getRepoName(repo));
      let cwd = path.join(__dirname, '../../../../');
      let fullCmd = `${PullRequestManager.REPOSITORY_UPDATE} ${repoPath}`;
      promises.push(
        this._exec(fullCmd, cwd)
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        () => resolve('updated repositories')
      ).catch(
        (err) => reject(err)
      );
    });

    return promise;
  }

  createPrs() {
    var promises = [];

    for (let repo of this.repos) {
      promises.push(
        this.gitHubPrSubmiter.createPr(
          PullRequestManager.getRepoUser(repo),
          PullRequestManager.getRepoName(repo),
          this.pullRequestMessage,
          this.destBranchName,
          this.sourceBranchName
        )
      );
    }

    var promise = new Promise((resolve, reject) => {
      Promise.all(promises).then(
        (prs) =>  resolve(prs)
      ).catch(
        (err) => reject(err)
      );
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

}

let pullRequestManager = new PullRequestManager();
pullRequestManager.ensureReposFolderSync();
pullRequestManager.copyRepos().then(
  (result) => {
    pullRequestManager.createDestBranches().then(
      (result) => {
        pullRequestManager.changeToDestBranches().then(
          (result) => {
            pullRequestManager.updateBranches().then(
              (result) => {
                pullRequestManager.commitChanges().then(
                  (result) => {
                    pullRequestManager.createPrs().then(
                      (result) => {
                        console.log('TOTAL DONE: ', result);
                      }
                    );
                  }
                ).catch(function (reason) {
                    console.log(reason);
                  });
              }
            );
          }
        );
      }
    );
  },

  (err) => console.error(err)
);



