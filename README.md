deep-microservices-skeleton
===========================

[Repository_Badges_Placeholder]

[Repository_Description_Placeholder]


## Getting Started

### Step 1. Install Pre-requisites

```bash
npm install deepify -g
```

> If you want to use `deepify` on Windows, please follow the steps from
[Windows Configuration](https://github.com/MitocGroup/deep-framework/blob/master/docs/windows.md)
before running `npm install deepify -g` and make sure all `npm` and `deepify` commands are executed
inside Git Bash.

### Step 2. Install Microservice(s) Locally

```bash
deepify install github://MitocGroup/deep-microservices-helloworld ~/deep-microservices-helloworld
```

> If you execute `mkdir ~/deep-microservices-helloworld && cd ~/deep-microservices-helloworld`
before `deepify install ...`, in this case path parameter is optional and can be skipped (e.g. 
`~/deep-microservices-helloworld`). It will assume current folder in all `deepify` commands.

### Step 3. Run Microservice(s) in Development

```bash
deepify server ~/deep-microservices-helloworld -o
```

> When this step is finished, you can open in your browser the link *http://localhost:8000*
and enjoy the deep-microservices-helloworld running locally.

### Step 4. Run Microservice(s) in Production

```bash
deepify deploy ~/deep-microservices-helloworld
```

> Amazon CloudFront distribution takes up to 20 minutes to provision, therefore don’t worry
if it returns an HTTP error in the first couple of minutes.


## Developer Resources

Having questions related to deep-microservices-skeleton?

- Ask questions: https://stackoverflow.com/questions/tagged/deep-framework
- Chat with us: https://gitter.im/MitocGroup/deep-framework
- Send an email: feedback@deep.mg

Interested in contributing to deep-microservices-skeleton?

- Contributing: https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/CONTRIBUTING.md
- Issue tracker: https://github.com/MitocGroup/deep-microservices-skeleton/issues
- Releases: https://github.com/MitocGroup/deep-microservices-skeleton/releases
- Roadmap: https://github.com/MitocGroup/deep-microservices-skeleton/blob/master/ROADMAP.md

Looking for web applications that uses (or are similar to) deep-microservices-skeleton?

- Hello World: https://hello.deep.mg | https://github.com/MitocGroup/deep-microservices-helloworld
- Todo App: https://todo.deep.mg | https://github.com/MitocGroup/deep-microservices-todo-app
- Enterprise Software Marketplace: https://www.deep.mg

## Sponsors

This repository is being sponsored by:
- [Mitoc Group](https://www.mitocgroup.com)
- [DEEP Marketplace](https://www.deep.mg)

This code can be used under MIT license:
> See [LICENSE](https://github.com/MitocGroup/deep-framework/blob/master/LICENSE) for more details.
