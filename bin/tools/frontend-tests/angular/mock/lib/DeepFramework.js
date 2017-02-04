DeepFramework.Kernel.load({
  'env': 'prod',
  'deployId': 'asdfdsfdsgdfgfdgfd5454654',
  'awsRegion': 'us-east-1',
  'models': [],
  'identityPoolId': 'us-east-1:1e6b7663-19ff-4a81-bc94-34543fdgf',
  'identityProviders': {
    'www.amazon.com': 'amzn1.application.cxvbgfh5454654654'
  },
  'microservices': {
    '{microserviceIdentifier}': {
      'isRoot': true,
      'parameters': {},
      'resources': {}
    }
  },
  'globals': {
    'logDrivers': {
      'sentry': {
        'dsn': 'https://905e3e7244fe432993751cb500b56b4d:3527453acb2c47bf9aa66707c65cc31d@app.getsentry.com/48093'
      }
    },
    'userProviderEndpoint': '@deep.account:user:retrieve',
    'security': {
      'identityProviders': {
        'www.amazon.com': 'amzn1.application.12057697ba3347cda73dd9f6d3b9ce2b'
      }
    }
  },
  'microserviceIdentifier': '{microserviceIdentifier}',
  'awsAccountId': 122435435456,
  'apiVersion': 'v1',
  'propertyIdentifier': 'propertyIdentifier',
  'timestamp': 1441198970148,
  'buckets': {
    'public': {
      'name': 'deep.prod.public.test2343'
    },
    'system': {
      'name': 'deep.prod.system.test2343'
    }
  },
  'tablesNames': {},
  'validationSchemas': [],
}, function(){});
