Step 1:

```bash
npm run prepare
```

- Copy package.json to root
- Explore posibility to run travor locally
- Install all global dependecies
- Install different version depending on node version (v4 vs v5)
- If e2e testing enabled, install protractor
- If jspm enabled, add JSPM_AUTH_TOKEN


Step 2:

```bash
npm run test
```

- Triggeres frontend tests, if found
- Triggers backend tests, if found
- Triggers end-to-end tests, if found
-- Worflow process related to Sauce Labs

Step 3:

```bash
npm run coverage
```

- Collects and sends coverage to Codacy
