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
    let fieldValue = testData['{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}'];
    {{else}}
    let fieldValue = testData['{{#if element.testid}}{{element.testid}}{{else if element.id}}{{element.id}}{{else if element.name}}{{element.name}}{{else}}field_value{{/if}}'] || '';
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
    
    {{/if}}
    {{/events}}
    
    cy.log('Test completed successfully!');
  });
});
