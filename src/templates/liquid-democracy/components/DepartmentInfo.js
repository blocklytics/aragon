import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { GU, Info, useTheme } from '@aragon/ui'
import { Header, Navigation, ScreenPropsType } from '../../kit'

function DepartmentInfo({
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
        title="Department"
        subtitle="Read the following information attentively"
      />
      <div
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <Paragraph>
          Departments are made up of stakeholders that are responsible for managing a particular portion of an Organization (as defined by the Management token holders).  
          Department token holders can vote on issues pertaining to their Department or delegate their voting power to other users.
          Organizations typically will have one or more Departments and are likely to add more over time as the Organization grows in complexity.
        </Paragraph>

        <Paragraph>Department Token holders can:</Paragraph>
        <Paragraph>
          <Strong>Make vote proposals</Strong> Token holders can propose issues be brought to a vote.  Optionally, these votes can be tied to a specific smart contract call upon passing of the vote.
        </Paragraph>
        <Paragraph>
          <Strong>Vote or delegate</Strong> Token holders can vote on issues directly or delegate their voting power to another entity they trust to align with their interests.
        </Paragraph>
        <Paragraph>
          <Strong>Undelegate</Strong> At any point, a user may reclaim their delegated voting power if they so choose.
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

DepartmentInfo.propTypes = {
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

export default DepartmentInfo
