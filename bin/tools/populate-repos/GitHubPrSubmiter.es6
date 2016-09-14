/**
 * Created by vcernomschi on 9/12/16.
 */

'use strict';

import GitHubApi from 'github';
import {Output} from './../Helper/Output';

export default class GitHubMsgPublisher {

  constructor() {
    this.github = new GitHubApi({
      debug: false,
      protocol: 'https',
      host: 'api.github.com',
      timeout: 5000,
      headers: {
        'user-agent': 'Code-Coverage-GitHub-App'
      },
      followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
      includePreview: true // default: false; includes accept headers to allow use of stuff under preview period
    });

    this.github.authenticate({
      type: 'oauth',
      token: process.env['GITHUB_OAUTH_TOKEN'],
    });
  }


  /**
   * @param {String} gitUser
   * @param {String} gitRepoName
   * @param {String} prTitle
   * @param {String} sourceBranch
   * @param {String} destBranch
   * @returns {Promise}
   */
  createPullRequest(gitUser, gitRepoName, prTitle, sourceBranch, destBranch) {

    var promise = new Promise((resolve, reject) => {

      this.github.pullRequests.create({
          user: gitUser,
          repo: gitRepoName,
          title: prTitle,
          head: sourceBranch,
          base: destBranch,
        },
        (err, result) => {

          if (err) {
            console.log(err);
            reject(err);
          }

          console.log(`<info>${result.html_url}</info> has been opened`);
          resolve(result.html_url);
        }
      );
    });

    return promise;
  }
}
