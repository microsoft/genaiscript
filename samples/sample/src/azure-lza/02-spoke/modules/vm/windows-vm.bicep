targetScope = 'resourceGroup'

// ------------------
//    PARAMETERS
// ------------------

param vmName string
param vmSize string

param vmWindowsOSVersion string = '2016-Datacenter'

param vmVnetName string
param vmSubnetName string
param vmSubnetAddressPrefix string
param vmNetworkSecurityGroupName string
param vmNetworkInterfaceName string

param vmAdminUsername string

@secure()
param vmAdminPassword string

@description('Optional. The tags to be assigned to the created resources.')
param tags object = {}

param location string = resourceGroup().location

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

resource vm 'Microsoft.Compute/virtualMachines@2021-04-01' =  {
  name: vmName
  location: location
  tags: tags
  zones: [
    '1'
  ]
  properties: {
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
        publisher: 'MicrosoftWindowsServer'
        offer: 'WindowsServer'
        sku: vmWindowsOSVersion
        version: 'latest'
      }
    }
    osProfile: {
      computerName: vmName
      adminUsername: vmAdminUsername
      adminPassword: vmAdminPassword
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
