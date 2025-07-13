targetScope = 'subscription'

// Parameters

@description('Specifies the policy definition to assign.')
param policy object


resource policyDefinition 'Microsoft.Authorization/policyDefinitions@2021-06-01' = {
  name: guid(policy.name)
  properties: {
    description: policy.definition.properties.description
    displayName: policy.definition.properties.displayName
    metadata: policy.definition.properties.metadata
    mode: policy.definition.properties.mode
    parameters: policy.definition.properties.parameters
    policyType: policy.definition.properties.policyType
    policyRule: policy.definition.properties.policyRule
  }
}

// Outputs
output policyDefinitionId string = policyDefinition.id
