Adding integration with Codeclimate/Travis for new projects
===========================================================

> To add integration with Codeclimate/Travis for new projects you should use `devs-deep` credentials.
> Please be aware and DON NOT INVITE new members to codeclimate, because it will make additional charge for each member.
         
## Steps to adding integration with Codeclimate/Travis for new projects

###1. Update new projects by skeleton update functionality.

> To update one repo you need to use: `./deep-microservices-skeleton/bin/tools/repository_update.sh ../path/to/project`

###2. Add project to [Travis](https://docs.travis-ci.com/user/getting-started).

###3. Add project to [Codeclimate](https://docs.codeclimate.com/docs/importing-repositories) with adding deploy keys if applicable.

###4. Add/check codeclimate integrations in `GitHub > Settings > Integrations & Services > Codeclimate` if applicable.

###5. Add Codeclimate integration with Git and Slack

> To add codeclimate integration with Git please [repeat steps](https://docs.codeclimate.com/docs/github)
> To add codeclimate integration with Slack please https://docs.codeclimate.com/docs/slack-integration
> Note: Please use one github token over all projects.

###6. Add encrypted tokens for codeclimate and coverage functionality;

###7. Update badges.

###8. Update new projects by skeleton update functionality.
