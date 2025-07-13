targetScope = 'resourceGroup'

// ------------------
//    PARAMETERS
// ------------------

param vmName string
param vmSize string

param vmVnetName string
param vmSubnetName string
param vmSubnetAddressPrefix string
param vmNetworkSecurityGroupName string
param vmNetworkInterfaceName string

param vmAdminUsername string

@secure()
param vmAdminPassword string

@secure()
param vmSshPublicKey string

@description('Type of authentication to use on the Virtual Machine. SSH key is recommended.')
@allowed([
  'sshPublicKey'
  'password'
])
param vmAuthenticationType string = 'password'

@description('Optional. The tags to be assigned to the created resources.')
param tags object = {}

param location string = resourceGroup().location

// ------------------
// VARIABLES
// ------------------

var linuxConfiguration = {
  disablePasswordAuthentication: true
  ssh: {
    publicKeys: [
      {
        path: '/home/${vmAdminUsername}/.ssh/authorized_keys'
        keyData: vmSshPublicKey
      }
    ]
  }
}

// ------------------
// RESOURCES
// ------------------

resource vmNetworkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2020-06-01' = {
  name: vmNetworkSecurityGroupName
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

resource vmSubnet 'Microsoft.Network/virtualNetworks/subnets@2020-11-01' = {
  name: '${vmVnetName}/${vmSubnetName}'
  properties: {
    addressPrefix: vmSubnetAddressPrefix
    networkSecurityGroup: {
      id: vmNetworkSecurityGroup.id
    }
  }
}

resource vmNetworkInterface 'Microsoft.Network/networkInterfaces@2021-02-01' = {
  name: vmNetworkInterfaceName
  location: location
  tags: tags
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: {
            id: vmSubnet.id
          }
          privateIPAllocationMethod: 'Dynamic'
        }
      }
    ]
  }
}

resource vm 'Microsoft.Compute/virtualMachines@2021-03-01' = {
  name: vmName
  location: location
  tags: tags
  properties: {
    osProfile: {
      computerName: vmName
      adminUsername: vmAdminUsername
      adminPassword: vmAdminPassword
      linuxConfiguration: ((vmAuthenticationType == 'password') ? null : linuxConfiguration)
    }
    hardwareProfile: {
      vmSize: vmSize
    }
    storageProfile: {
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Standard_LRS'
        }
      }
      imageReference: {
        publisher: 'Canonical'
        offer: 'UbuntuServer'
        sku: '18.04-LTS'
        version: 'latest'
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: vmNetworkInterface.id
        }
      ]
    }
  }
}
