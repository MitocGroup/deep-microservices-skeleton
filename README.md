deep-microservices-skeleton
===========================

[Repository_Badges_Placeholder]

[Repository_Details_Placeholder]


## Getting Started

Install DEEP CLI, also known as deepify:

```bash
npm install deepify -g
```

> If you want to use `deepify` on Windows, please follow the steps from
[Windows Configuration](https://github.com/MitocGroup/deep-framework/blob/master/docs/windows.md)
before running `npm install deepify -g` and make sure all `npm` and `deepify` commands are executed
inside Git Bash.

Using deepify, dump locally the deep-microservices-skeleton repository:

```bash
deepify install github://MitocGroup/deep-microservices-skeleton ~/deep-microservices-skeleton
```

> If you first run `mkdir ~/deep-microservices-skeleton && cd ~/deep-microservices-skeleton`,
then optional path parameter `~/deep-microservices-skeleton` can be skipped in all `deepify` commands

Next, run locally the web application in deep-microservices-skeleton:

```bash
deepify server ~/deep-microservices-skeleton -o
```

> When this step is finished, you can open in your browser the link *http://localhost:8000*
and enjoy the deep-microservices-skeleton running locally.

Finally, deploy the deep-microservices-skeleton to cloud provider:

```bash
deepify deploy ~/deep-microservices-skeleton
```

> Amazon CloudFront distribution takes up to 20 minutes to provision, therefore don’t worry
if it returns an HTTP error in the first couple of minutes.


## Developer Resources

Building an application like deep-microservices-skeleton?

- Ask questions: https://stackoverflow.com/questions/tagged/deep-framework
- Chat with us: https://gitter.im/MitocGroup/deep-framework
- Send messages: feedback@deep.mg

Interested in contributing to deep-microservices-skeleton?

- Contributing: https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/CONTRIBUTING.md
- Issue tracker: https://github.com/MitocGroup/deep-microservices-skeleton/issues
- Releases: https://github.com/MitocGroup/deep-microservices-skeleton/releases
- Roadmap: https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/ROADMAP.md

Examples of Web Applications built on top of DEEP Framework:

- Hello World: https://hello.deep.mg | https://github.com/MitocGroup/deep-microservices-helloworld
- Todo App: https://todo.deep.mg | https://github.com/MitocGroup/deep-microservices-todo-app
- Enterprise Software Marketplace: https://www.deep.mg

## Sponsors

This repository is being sponsored by:
- [Mitoc Group](https://www.mitocgroup.com)
- [DEEP Marketplace](https://www.deep.mg)

This code can be used under MIT license:
> See [LICENSE](https://github.com/MitocGroup/deep-framework/blob/master/LICENSE) for more details.
