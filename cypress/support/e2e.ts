import './commands';
import '@shelex/cypress-allure-plugin';
beforeEach(() => {
  cy.visit('/', {
    onBeforeLoad(win) {
      // remove suporte a service worker
      delete (win.navigator as any).serviceWorker;
    },
  });
});