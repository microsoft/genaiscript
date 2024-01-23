// based on: https://github.com/Azure-Samples/aca-azure-policy

// Parameters
@description('Specifies the location of the deployment.')
param location string

@description('Specifies the policy definition to assign.')
param policy object

@description('Specifies the resource id of the policy definition to assign.')
param policyDefinitionId string

// Resources
resource policyAssignment 'Microsoft.Authorization/policyAssignments@2022-06-01' = {
  name: uniqueString('${policy.name}')
  location: location
  properties: {
    description: policy.definition.properties.description
    displayName: policy.definition.properties.displayName
    policyDefinitionId: policyDefinitionId
    parameters: policy.parameters
  }
}

// Outputs
output policyAssignmentId string = policyAssignment.id
