// Cypress TypeScript Test Template

describe('TestCaptive Generated Test', () => {
  let testData: any;

  before(() => {
    // Load test data
    cy.fixture('test_data.json').then((data) => {
      testData = data;
    });
  });

  it('should execute recorded user flow', () => {
    {{#events}}
    {{#if (eq event 'navigation')}}
    // Navigate to {{page.title}}
    {{#if isFirstNavigation}}
    cy.visit('{{page.url}}');
    {{else}}
    // Verify URL change
    cy.url().should('include', '{{page.url}}');
    {{/if}}
    cy.wait(2000);
    
    {{else if (eq event 'click')}}
    // Click {{#if element.text}}"{{element.text}}"{{else}}element{{/if}}
    {{#if element.testid}}
    cy.get('[data-testid="{{element.testid}}"]').click();
    {{else if element.id}}
    cy.get('#{{element.id}}').click();
    {{else if element.name}}
    cy.get('[name="{{element.name}}"]').click();
    {{else if element.xpath}}
    cy.xpath('{{element.xpath}}').click();
    {{else}}
    cy.get('{{element.cssSelector}}').click();
    {{/if}}
    cy.wait(1000);
    
    {{else if (or (eq event 'change') (eq event 'input'))}}
    // Enter text in {{#if element.name}}"{{element.name}}"{{else if element.id}}"{{element.id}}"{{else}}input field{{/if}}
    {{#if value}}
    // Use test data from JSON file
    const fieldValue = testData['{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}'];
    {{else}}
    const fieldValue = testData['{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}'] || '';
    {{/if}}
    {{#if element.testid}}
    cy.get('[data-testid="{{element.testid}}"]').clear().type(fieldValue);
    {{else if element.id}}
    cy.get('#{{element.id}}').clear().type(fieldValue);
    {{else if element.name}}
    cy.get('[name="{{element.name}}"]').clear().type(fieldValue);
    {{else if element.xpath}}
    cy.xpath('{{element.xpath}}').clear().type(fieldValue);
    {{else}}
    cy.get('{{element.cssSelector}}').clear().type(fieldValue);
    {{/if}}
    cy.wait(500);
    
    {{else if (eq event 'keydown')}}
    // Key press: {{value}}
    {{#if element.id}}
    cy.get('#{{element.id}}').type('{{"{{" + value + "}}"}}');
    {{else if element.name}}
    cy.get('[name="{{element.name}}"]').type('{{"{{" + value + "}}"}}');
    {{else}}
    cy.get('{{element.cssSelector}}').type('{{"{{" + value + "}}"}}');
    {{/if}}
    cy.wait(500);
    
    {{else if (eq event 'assertion')}}
    // Assertion: {{event.assertion.description}}
    {{#if (eq assertion.type 'text-equals')}}
    {{#if assertion.element.testid}}
    cy.get('[data-testid="{{event.assertion.element.testid}}"]').should('have.text', '{{event.assertion.expectedValue}}');
    {{else if assertion.element.id}}
    cy.get('#{{event.assertion.element.id}}').should('have.text', '{{event.assertion.expectedValue}}');
    {{else if assertion.element.xpath}}
    cy.xpath('{{event.assertion.element.xpath}}').should('have.text', '{{event.assertion.expectedValue}}');
    {{else}}
    cy.get('{{event.assertion.element.cssSelector}}').should('have.text', '{{event.assertion.expectedValue}}');
    {{/if}}
    
    {{else if (eq assertion.type 'text-contains')}}
    {{#if assertion.element.testid}}
    cy.get('[data-testid="{{event.assertion.element.testid}}"]').should('contain.text', '{{event.assertion.expectedValue}}');
    {{else if assertion.element.id}}
    cy.get('#{{event.assertion.element.id}}').should('contain.text', '{{event.assertion.expectedValue}}');
    {{else if assertion.element.xpath}}
    cy.xpath('{{event.assertion.element.xpath}}').should('contain.text', '{{event.assertion.expectedValue}}');
    {{else}}
    cy.get('{{event.assertion.element.cssSelector}}').should('contain.text', '{{event.assertion.expectedValue}}');
    {{/if}}
    
    {{else if (eq assertion.type 'visible')}}
    {{#if assertion.element.testid}}
    cy.get('[data-testid="{{event.assertion.element.testid}}"]').should('be.visible');
    {{else if assertion.element.id}}
    cy.get('#{{event.assertion.element.id}}').should('be.visible');
    {{else if assertion.element.xpath}}
    cy.xpath('{{event.assertion.element.xpath}}').should('be.visible');
    {{else}}
    cy.get('{{event.assertion.element.cssSelector}}').should('be.visible');
    {{/if}}
    
    {{else if (eq assertion.type 'not-visible')}}
    {{#if assertion.element.testid}}
    cy.get('[data-testid="{{event.assertion.element.testid}}"]').should('not.be.visible');
    {{else if assertion.element.id}}
    cy.get('#{{event.assertion.element.id}}').should('not.be.visible');
    {{else if assertion.element.xpath}}
    cy.xpath('{{event.assertion.element.xpath}}').should('not.be.visible');
    {{else}}
    cy.get('{{event.assertion.element.cssSelector}}').should('not.be.visible');
    {{/if}}
    
    {{else if (eq assertion.type 'enabled')}}
    {{#if assertion.element.testid}}
    cy.get('[data-testid="{{event.assertion.element.testid}}"]').should('be.enabled');
    {{else if assertion.element.id}}
    cy.get('#{{event.assertion.element.id}}').should('be.enabled');
    {{else if assertion.element.xpath}}
    cy.xpath('{{event.assertion.element.xpath}}').should('be.enabled');
    {{else}}
    cy.get('{{event.assertion.element.cssSelector}}').should('be.enabled');
    {{/if}}
    
    {{else if (eq assertion.type 'disabled')}}
    {{#if assertion.element.testid}}
    cy.get('[data-testid="{{event.assertion.element.testid}}"]').should('be.disabled');
    {{else if assertion.element.id}}
    cy.get('#{{event.assertion.element.id}}').should('be.disabled');
    {{else if assertion.element.xpath}}
    cy.xpath('{{event.assertion.element.xpath}}').should('be.disabled');
    {{else}}
    cy.get('{{event.assertion.element.cssSelector}}').should('be.disabled');
    {{/if}}
    
    {{else if (eq assertion.type 'url-contains')}}
    cy.url().should('include', '{{event.assertion.expectedValue}}');
    
    {{/if}}
    cy.wait(500);
    
    {{/if}}
    {{/events}}
    
    cy.log('Test completed successfully!');
  });
});

