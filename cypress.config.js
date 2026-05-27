const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://admin-hom.sgagenda.com/',

    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',

    supportFile: 'cypress/support/e2e.ts',

    chromeWebSecurity: false,

    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-service-worker');
        }
        return launchOptions;
      });

      return config;
    },
  },
});