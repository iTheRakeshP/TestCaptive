/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to get element by data-testid attribute
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

export {};
