import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { GU, useTheme } from '@aragon/ui'
import { Header, Navigation, ScreenPropsType } from '../../kit'

function ManagementInfo({
  screenProps: { back, data, next, screenIndex, screens },
}) {
  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      next({ ...data })
    },
    [data, next]
  )

  return (
    <div>
      <Header
        title="Organization's management"
        subtitle="Read the following information attentively"
      />
      <div
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <Paragraph>
          Management is the stakeholder group that is in charge of making structural changes to the Organization. 
          Management token holders are represented through a custom token and enforce their decisions via a dedicated voting app that acts similarly to a traditional multisig account. 
          Their privileges are intentionally broad to allow for flexibility when first setting up the DAO, in the spirit of progressive decentralization.  
          This is likely the stakeholder group you want to decentralize last, and you may want to intentionally limit some of their permissions before doing so.
          When you are ready to decentralize, though, it should be straightforward - management uses the same delegated voting app as any other Department under the hood.
        </Paragraph>
        <Paragraph>Management has the ability to:</Paragraph>
        <Paragraph>
          <Strong>Create new Departments</Strong> Management decides when to add new Departments 
          to the Organization (with their own dedicated voting app).
        </Paragraph>
        <Paragraph>
          <Strong>Manage permissions for Departments</Strong> Management decides when to grant or revoke permissions for existing Departments.
        </Paragraph>
        <Paragraph>
          <Strong>Manage funds for the Organization</Strong> Management controls the Vault / Finance app
          and can allocate funds at their discretion.
        </Paragraph>
        <Paragraph>
          <Strong>Interact with external contracts (optional)</Strong> If the optional Agent app is installed, management will be able to use this app to interact with external contracts.
        </Paragraph>
      </div>
      <Navigation
        backEnabled
        nextEnabled
        nextLabel={`Next: ${screens[screenIndex + 1][0]}`}
        onBack={back}
        onNext={handleSubmit}
      />
    </div>
  )
}

ManagementInfo.propTypes = {
  screenProps: ScreenPropsType.isRequired,
}

function Paragraph({ children, ...props }) {
  const theme = useTheme()
  return (
    <p
      css={`
        color: ${theme.contentSecondary};
        & + & {
          margin-top: ${2 * GU}px;
        }
      `}
      {...props}
    >
      {children}
    </p>
  )
}
Paragraph.propTypes = {
  children: PropTypes.node,
}

function Strong({ children, ...props }) {
  const theme = useTheme()
  return (
    <span
      css={`
        color: ${theme.content};
        font-weight: 800;
      `}
      {...props}
    >
      {children}
    </span>
  )
}
Strong.propTypes = {
  children: PropTypes.string,
}

export default ManagementInfo
