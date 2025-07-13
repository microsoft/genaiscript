// ------------------
//    PARAMETERS
// ------------------

@description('The location where the resources will be created.')
param location string

@description('The name of the Container Registry that will be allow-listed by the policy.')
param containerRegistryName string

var namingRules = json(loadTextContent('../../../../../../shared/bicep/naming/naming-rules.jsonc'))

// Azure Container Apps Built-in Policy Definitions: https://learn.microsoft.com/azure/container-apps/policy-reference#policy-definitions
var builtInPolicies = [  
  {
    name: 'authentication-should-be-enabled-on-container-apps'
    definition: {
      properties: {
        displayName: 'Authentication should be enabled on container apps'
        description: 'Container Apps Authentication is a feature that can prevent anonymous HTTP requests from reaching the Container App, or authenticate those that have tokens before they reach the Container App'
      }
    }
    parameters: {
      effect: {
        value: 'AuditIfNotExists'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/2b585559-a78e-4cc4-b1aa-fb169d2f6b96'
  }
  {
    name: 'container-app-environments-should-use-network-injection'
    definition: {
      properties: {
        displayName: 'Container App environments should use network injection'
        description: 'Container Apps environments should use virtual network injection to: 1.Isolate Container Apps from the public internet 2.Enable network integration with resources on-premises or in other Azure virtual networks 3.Achieve more granular control over network traffic flowing to and from the environment'    
      }
    }
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/8b346db6-85af-419b-8557-92cee2c0f9bb'
  }
  {
    name: 'container-app-should-configure-with-volume-mount'
    definition: {
      properties: {
        displayName: 'Container App should configure with volume mount'
        description: 'Enforce the use of volume mounts for Container Apps to ensure availability of persistent storage capacity'    
      }
    }
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/7c9f3fbb-739d-4844-8e42-97e3be6450e0'
  }
  {
    name: 'container-app-should-disable-public-network-access'
    definition: {
      properties: {
        displayName: 'Container Apps environment should disable public network access'
        description: 'Disable public network access to improve security by exposing the Container Apps environment through an internal load balancer. This removes the need for a public IP address and prevents internet access to all Container Apps within the environment.'    
      }
    }
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/d074ddf8-01a5-4b5e-a2b8-964aed452c0a'
  }
  {
    name: 'container-apps-should-disable-external-network-access'
    definition: {
      properties: {
        displayName: 'Container Apps should disable external network access'
        description: 'Disable external network access to your Container Apps by enforcing internal-only ingress. This will ensure inbound communication for Container Apps is limited to callers within the Container Apps environment'    
      }
    }
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/783ea2a8-b8fd-46be-896a-9ae79643a0b1'
  }
  {
    name: 'containerapps-should-only-be-accessible-over-HTTPS'
    definition: {
      properties: {
        displayName: 'Container Apps should only be accessible over HTTPS'
        description: 'Use of HTTPS ensures server/service authentication and protects data in transit from network layer eavesdropping attacks. Disabling "allowInsecur" will result in the automatic redirection of requests from HTTP to HTTPS connections for container apps.'    
      }
    }
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/0e80e269-43a4-4ae9-b5bc-178126b8a5cb'
  }
  {
    name: 'managed-identity-should-be-enabled'
    definition: {
      properties: {
        displayName: 'Managed Identity should be enabled for Container Apps'
        description: 'Enforcing managed identity ensures Container Apps can securely authenticate to any resource that supports Azure AD authentication'    
      }
    }
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/b874ab2d-72dd-47f1-8cb5-4a306478a4e7'
  }
  
]

// credits: https://techcommunity.microsoft.com/t5/fasttrack-for-azure/azure-policy-for-azure-container-apps-yes-please/ba-p/3775200
// https://github.com/Azure-Samples/aca-azure-policy/tree/main
var customPolicies = [
  {
    name: 'aca-allowed-container-registries'
    definition: json(loadTextContent('policy-definitions/aca-allowed-container-registries.json'))
    parameters: {
      listOfAllowedContainerRegistries: {
        value: [
          'mcr.microsoft.com'
          'docker.io'
          'ghcr.io'
          '${containerRegistryName}.azurecr.io'
        ]
      }
      effect: {
        value: 'Audit'
      }
    }
  }
  {
    name: 'aca-replica-count'
    definition: json(loadTextContent('policy-definitions/aca-replica-count.json'))
    parameters: {
      minReplicas: {
        value: 0
      }
      maxReplicas: {
        value: 30
      }
      effect: {
        value: 'Audit'
      }
    }
    identity: false
  }
  {
    name: 'aca-no-liveness-probes'
    definition: json(loadTextContent('policy-definitions/aca-no-liveness-probes.json'))
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    identity: false
  }
  {
    name: 'aca-no-readiness-probes'
    definition: json(loadTextContent('policy-definitions/aca-no-readiness-probes.json'))
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    identity: false
  }
  {
    name: 'aca-no-startup-probes'
    definition: json(loadTextContent('policy-definitions/aca-no-startup-probes.json'))
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    identity: false
  }
  {
    name: 'aca-required-cpu-and-memory'
    definition: json(loadTextContent('policy-definitions/aca-required-cpu-and-memory.json'))
    parameters: {
      maxCpu: {
        value: '1.0'
      }
      maxMemory: {
        value: '2.5'
      }
      effect: {
        value: 'Audit'
      }
    }
    identity: false
  }
  {
    name: 'aca-no-monitoring'
    definition: json(loadTextContent('policy-definitions/aca-no-monitoring.json'))
    parameters: {
      effect: {
        value: 'Audit'
      }
    }
    identity: false
  }
]

module builtInPolicyAssignment 'policy-assignment.bicep' = [for (policy, i) in builtInPolicies: {
  name: 'poAssign_${take(policy.name, 40)}'
  params: {    
    location: location
    policy: policy
    policyDefinitionId: policy.policyDefinitionId    
  }  
}]


// resource policyDefinition 'Microsoft.Authorization/policyDefinitions@2021-06-01' = [for policy in customPolicies: {
//   name: guid(policy.name)
//   properties: {
//     description: policy.definition.properties.description
//     displayName: policy.definition.properties.displayName
//     metadata: policy.definition.properties.metadata
//     mode: policy.definition.properties.mode
//     parameters: policy.definition.properties.parameters
//     policyType: policy.definition.properties.policyType
//     policyRule: policy.definition.properties.policyRule
//   }
// }]

module policyDefinition 'policy-definition.bicep' = [for policy in customPolicies: {
  name: 'poDef_${namingRules.regionAbbreviations[toLower(location)]}_${guid(policy.name)}'
  scope: subscription()
  params: {
    policy: policy
  }
}]

module customPolicyAssignment 'policy-assignment.bicep' = [for (policy, i) in customPolicies: {
  name: 'poAssign_${take(policy.name, 40)}'
  params: {    
    location: location
    policy: policy
    policyDefinitionId: policyDefinition[i].outputs.policyDefinitionId  
  } 
  dependsOn: [
    policyDefinition
  ] 
}]
