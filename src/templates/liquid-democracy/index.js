/* eslint-disable react/prop-types */
import React from 'react'
import { Decimal } from 'decimal.js'
import {
  ClaimDomainScreen,
  ReviewScreen,
} from '../kit'
import Management from './components/Management'
import ManagementInfo from './components/ManagementInfo'
import Department from './components/Department'
import DepartmentInfo from './components/DepartmentInfo'
import header from './header.svg'
import icon from './icon.svg'

function BN(value) {
  return new Decimal(value)
}

function completeDomain(domain) {
  return domain ? `${domain}.aragonid.eth` : ''
}

function adjustVotingSettings(support, quorum) {
  // The max value for both support and quorum is 100% - 1
  const hundredPercent = onePercent.mul(BN(100))

  let adjustedSupport = onePercent.mul(BN(support))
  if (adjustedSupport.eq(hundredPercent)) {
    adjustedSupport = adjustedSupport.sub(one)
  }

  let adjustedQuorum = onePercent.mul(BN(quorum))
  if (adjustedQuorum.eq(hundredPercent)) {
    adjustedQuorum = adjustedQuorum.sub(one)
  }

  return [adjustedSupport.toFixed(0), adjustedQuorum.toFixed(0)]
}

function extractVotingSettings(voting) {
  const [adjustedSupport, adjustedQuorum] = adjustVotingSettings(
    voting.support,
    voting.quorum
  )
  const duration = BN(voting.duration).toFixed(0)

  return [adjustedSupport, adjustedQuorum, duration]
}

export default {
  id: 'liquid-democracy-template.open.aragonpm.eth',
  name: 'Liquid Democracy',
  beta: true,
  header,
  icon,
  description: `
    Launch an Organization made up of 1 or more Departments that have distinct voting rights within the Organization. 
    Each tokenholder in each Department has the ability to vote directly on issues relevant to their Department or delegate their voting power to others.
  `,
  userGuideUrl: 'https://github.com/blocklytics/liquid-democracy-aragon-organization-template',
  sourceCodeUrl: 'https://github.com/blocklytics/liquid-democracy-aragon-organization-template',
  registry: 'open.aragonpm.eth',
  apps: [
    { appName: 'delegable-voting.open.aragonpm.eth', label: 'Voting: Management' },
    { appName: 'delegable-token-manager.open.aragonpm.eth', label: 'Tokens: Management' },
    { appName: 'delegable-voting.open.aragonpm.eth', label: 'Voting: Department' },
    { appName: 'delegable-token-manager.open.aragonpm.eth', label: 'Tokens: Department' },
    { appName: 'finance.aragonpm.eth', label: 'Finance' },
  ],
  optionalApps: [{ appName: 'agent.aragonpm.eth', label: 'Agent' }],
  screens: [
    [
      data => completeDomain(data.domain) || 'Claim domain',
      props => <ClaimDomainScreen screenProps={props} />,
    ],
    ['Configure Management', props => <ManagementInfo screenProps={props} />],
    [
      'Configure Management',
      props => (
        <Management
          dataKey="management"
          screenProps={props}
          title="Configure Management"
        />
      ),
    ],
    ['Configure Department', props => <DepartmentInfo screenProps={props} />],
    [
      'Configure Department',
      props => (
        <Department
          dataKey="department"
          screenProps={props}
          title="Configure Department"
        />
      ),
    ],
    [
      'Review information',
      props => {
        const { domain, management, department } = props.data
        return (
          <ReviewScreen
            screenProps={props}
            items={[
              {
                label: 'General info',
                fields: [
                  ['Organization template', 'Liquid Democracy'],
                  ['Name', completeDomain(domain)],
                ],
              },
              {
                label: (
                  <KnownAppBadge appName="voting.aragonpm.eth" label="Voting: Management" />
                ),
                fields: Management.formatReviewFields(management),
              },
              {
                label: (
                  <KnownAppBadge appName="voting.aragonpm.eth" label="Voting: Department" />
                ),
                fields: Department.formatReviewFields(department),
              }
            ]}
          />
        )
      },
    ],
  ],
  prepareTransactions(createTx, data) {
    const financePeriod = 0 // default

    const { domain, optionalApps, management, department } = data
    const useAgentAsVault = optionalApps.includes('agent.aragonpm.eth')

    const managementMembers = management.members
    const baseStake = new BN(10).pow(new BN(management.decimals))
    const managementStakes = managementMembers.map(([_, stake]) =>
      baseStake.mul(new BN(stake.toString())).toString()
    )
    const managementVotingSettings = extractVotingSettings(management)
    const departmentVotingSettings = extractVotingSettings(department)

    return [
      {
        name: 'Prepare organization',
        transaction: createTx('prepareInstance', [
          management.tokenName,
          management.tokenSymbol,
          management.decimals,
          management.transferable,
          management.delegable,
          managementVotingSettings,
          management.maxTokens,
        ]),
      },
      {
        name: 'Install Department apps',
        // Note that we need to keep this usage of "share"
        // as the template contract only exposes "installShareApps()"
        transaction: createTx('installDepartment', [
          department.tokenName,
          department.tokenSymbol,
          department.decimals,
          department.transferable,
          department.delegable,
          departmentVotingSettings,
          department.maxTokens
        ]),
      },
      {
        name: 'Finalize Organization',
        transaction: createTx('finalizeInstance', [
          domain,
          managementMembers,
          managementStakes,
          financePeriod,
          useAgentAsVault,
        ]),
      },
    ]
  },
}
