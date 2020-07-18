import React, {
  useCallback,
  useEffect,
  useReducer,
  useState,
  useRef,
} from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  DropDown,
  EthIdenticon,
  Field,
  GU,
  Help,
  IconPlus,
  IconTrash,
  Info,
  RADIUS,
  TextInput,
  textStyle,
  isAddress,
  useTheme,
} from '@aragon/ui'
import {
  Duration,
  Header,
  IdentityBadge,
  KnownAppBadge,
  Navigation,
  ScreenPropsType,
} from '../../kit'
import {
  formatDuration,
  DAY_IN_SECONDS,
  MINUTE_IN_SECONDS,
} from '../../kit/kit-utils'

const DEFAULT_SUPPORT = 50
const DEFAULT_QUORUM = 15
const DEFAULT_DURATION = DAY_IN_SECONDS

function reduceFields(fields, [field, value]) {
  if (field === 'duration') {
    return { ...fields, duration: value }
  }
  if (field === 'quorum') {
    return {
      ...fields,
      // 100% quorum is not possible, but any adjustments necessary should be handled in the
      // template frontends themselves
      quorum: value,
      support: Math.max(fields.support, value),
    }
  }
  if (field === 'support') {
    return {
      ...fields,
      // 100% support is not possible, but any adjustments necessary should be handled in the
      // template frontends themselves
      support: value,
      quorum: Math.min(fields.quorum, value),
    }
  }
  return fields
}

function useFieldsLayout() {
  // In its own hook to be adapted for smaller views
  return `
    display: grid;
    grid-template-columns: auto ${12 * GU}px;
    grid-column-gap: ${1.5 * GU}px;
  `
}

function validateDuplicateAddresses(members) {
  const validAddresses = members
    .map(([address]) => address.toLowerCase())
    .filter(address => isAddress(address))

  return validAddresses.length === new Set(validAddresses).size
}

function validationError(
  tokenName,
  tokenSymbol,
  members,
  duration
) {
  if (!members.some(address => isAddress(address))) {
    return 'You need at least one valid address.'
  }
  if (!validateDuplicateAddresses(members)) {
    return 'One of your members is using the same address than another member. Please ensure every member address is unique.'
  }
  if (!tokenName.trim()) {
    return 'Please add a token name.'
  }
  if (!tokenSymbol) {
    return 'Please add a token symbol.'
  }
  if (duration < 10 * MINUTE_IN_SECONDS) {
    return 'Please ensure the vote duration is equal to or longer than 10 minutes.'
  }
  return null
}

function Management({
  dataKey,
  screenProps: { back, data, next, screenIndex, screens },
  title,
}) {
  const screenData = (dataKey ? data[dataKey] : data) || {}

  const theme = useTheme()
  const fieldsLayout = useFieldsLayout()

  const [formError, setFormError] = useState()
  const [focusLastMemberNext, setFocusLastMemberNext] = useState(false)
  const [tokenName, setTokenName] = useState(screenData.tokenName || '')
  const [tokenSymbol, setTokenSymbol] = useState(screenData.tokenSymbol || '')
  const [members, setMembers] = useState(
    screenData.members && screenData.members.length > 0
      ? screenData.members
      : ['']
  )
  const [{ support, quorum, duration }, updateField] = useReducer(
    reduceFields,
    {
      support: screenData.support || DEFAULT_SUPPORT,
      quorum: screenData.quorum || DEFAULT_QUORUM,
      duration: screenData.duration || DEFAULT_DURATION,
    }
  )

  const membersRef = useRef()
  const supportRef = useRef()
  const quorumRef = useRef()

  const handleSupportRef = useCallback(ref => {
    supportRef.current = ref
    if (ref) {
      ref.focus()
    }
  }, [])

  const isPercentageFieldFocused = useCallback(() => {
    return (
      (supportRef.current &&
        supportRef.current.element === document.activeElement) ||
      (quorumRef.current &&
        quorumRef.current.element === document.activeElement)
    )
  }, [])

  // Focus the token name as soon as it becomes available
  const handleTokenNameRef = useCallback(element => {
    if (element) {
      element.focus()
    }
  }, [])

  const handleTokenNameChange = useCallback(event => {
    setFormError(null)
    setTokenName(event.target.value)
  }, [])

  const handleTokenSymbolChange = useCallback(event => {
    setFormError(null)
    setTokenSymbol(event.target.value.trim().toUpperCase())
  }, [])

  useEffect(() => {
    if (!focusLastMemberNext || !membersRef.current) {
      return
    }

    setFocusLastMemberNext(false)

    // This could be managed in individual MemberField components, but using
    // the container with a .member class makes it simpler to manage, since we
    // want to focus in three cases:
    //   - A new field is being added.
    //   - A field is being removed.
    //   - The first field is being emptied.
    //
    const elts = membersRef.current.querySelectorAll('.member')
    if (elts.length > 0) {
      elts[elts.length - 1].querySelector('input').focus()
    }
  }, [focusLastMemberNext])

  const focusLastMember = useCallback(() => {
    setFocusLastMemberNext(true)
  }, [])

  const hideRemoveButton = members.length < 2 && !members[0]

  const disableNext =
    !tokenName ||
    !tokenSymbol ||
    !members.every(account => account && account !== '')

  const addMember = useCallback(() => {
    setFormError(null)
    setMembers(members => [...members, ''])
    focusLastMember()
  }, [focusLastMember])

  const removeMember = useCallback(
    index => {
      setFormError(null)
      setMembers(members =>
        members.length < 2
          ? // When the remove button of the last field
            // gets clicked, we only empty the field.
            []
          : members.filter((_, i) => i !== index)
      )
      focusLastMember()
    },
    [focusLastMember]
  )

  const updateMember = useCallback((index, updatedAccount) => {
    setFormError(null)
    setMembers(members =>
      members.map((member, i) => (i === index ? updatedAccount : member))
    )
  }, [])

  const handleSupportChange = useCallback(value => {
    setFormError(null)
    updateField(['support', value])
  }, [])

  const handleQuorumChange = useCallback(value => {
    setFormError(null)
    updateField(['quorum', value])
  }, [])

  const handleDurationChange = useCallback(value => {
    setFormError(null)
    updateField(['duration', value])
  }, [])

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      const error = validationError(
        tokenName,
        tokenSymbol,
        members,
        duration
      )
      setFormError(error)

      // If one of the percentage fields is focused when the form is submitted,
      // move the focus on the next button instead.
      if (isPercentageFieldFocused() && prevNextRef.current) {
        prevNextRef.current.focusNext()
        return
      }

      if (!error) {
        const screenData = {
          duration,
          quorum: Math.floor(quorum),
          members: members.filter(account => isAddress(account)),
          support: Math.floor(support),
          tokenName,
          tokenSymbol
        }
        const mergedData = dataKey
          ? { ...data, [dataKey]: screenData }
          : { ...data, ...screenData }

        next(mergedData)
      }
    },
    [
      data,
      dataKey,
      members,
      next,
      tokenName,
      tokenSymbol,
      support,
      quorum,
      duration,
      isPercentageFieldFocused,
    ]
  )

  return (
    <form
      css={`
        display: grid;
        align-items: center;
        justify-content: center;
      `}
    >
      <Header title={title} />
      <Subtitle
        content={
          <span
            css={`
              display: flex;
              align-items: center;
              justify-content: flex-start;
              margin-bottom
            `}
          >
            Choose your
            <span
              css={`
                display: flex;
                margin: 0 ${1.5 * GU}px;
              `}
            >
              <KnownAppBadge
                appName="token-manager.aragonpm.eth"
                label="Tokens: Management"
              />
            </span>
            settings
          </span>
        }
      />
      <Info
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        These settings determine who should be a member of management and
        information related to the token used for determining membership. The
        management voting app acts similarly to a traditional multisig account.
      </Info>
      <div
        css={`
          ${fieldsLayout};
        `}
      >
        <Field
          label={
            <React.Fragment>
              Management token name
              <Help hint="What is Management Token Name?">
                <strong>Management Token Name</strong> will be the name assigned to
                the token representing the organization's management.{' '}
                <em>For example: My Management Token.</em>
              </Help>
            </React.Fragment>
          }
        >
          {({ id }) => (
            <TextInput
              ref={handleTokenNameRef}
              id={id}
              onChange={handleTokenNameChange}
              placeholder="My Management Token"
              value={tokenName}
              wide
            />
          )}
        </Field>

        <Field
          label={
            <React.Fragment>
              Management token symbol
              <Help hint="What is Management Token Symbol?">
                <strong>Management Token Symbol</strong> will be the shortened name
                (typically in capital letters) assigned to the token
                representing the organization's management.{' '}
                <em>For example: MGMT.</em>
              </Help>
            </React.Fragment>
          }
        >
          {({ id }) => (
            <TextInput
              id={id}
              onChange={handleTokenSymbolChange}
              value={tokenSymbol}
              placeholder="MGMT"
              wide
            />
          )}
        </Field>
      </div>
      <Field
        label={
          <div
            css={`
              width: 100%;
              ${fieldsLayout}
            `}
          >
            <div>Management members</div>
          </div>
        }
      >
        <div ref={membersRef}>
          {members.map((member, index) => (
            <MemberField
              key={index}
              index={index}
              member={member}
              onRemove={removeMember}
              hideRemoveButton={hideRemoveButton}
              onUpdate={updateMember}
            />
          ))}
        </div>
        <Button
          icon={
            <IconPlus
              css={`
                color: ${theme.accent};
              `}
            />
          }
          label="Add more"
          onClick={addMember}
        />
      </Field>

      <Subtitle
        content={
          <span
            css={`
              display: flex;
              align-items: center;
              justify-content: flex-start;
              margin-bottom
            `}
          >
            Choose your
            <span
              css={`
                display: flex;
                margin: 0 ${1.5 * GU}px;
              `}
            >
              <KnownAppBadge
                appName="voting.aragonpm.eth"
                label="Voting: Management"
              />
            </span>
            settings
          </span>
        }
      />

      <Info
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <p>
          These settings affect the decision making process for management members.
        </p>
        <p css={`margin-top: {1 * GU}px`}>
          The support and minimum approval thresholds are strict requirements,
          such that votes will only pass if they achieve approval percentages
          greater than these thresholds.
        </p>
      </Info>

      <PercentageField
        ref={handleSupportRef}
        label={
          <React.Fragment>
            Support %
            <Help hint="What is Support?">
              <strong>Support</strong> is the relative percentage of tokens that
              are required to vote “Yes” for a proposal to be approved. For
              example, if “Support” is set to 50%, then more than 50% of the{' '}
              {tokenSymbol || 'tokens'} used to vote on a proposal must vote
              “Yes” for it to pass.
            </Help>
          </React.Fragment>
        }
        value={support}
        onChange={handleSupportChange}
      />

      <PercentageField
        ref={quorumRef}
        label={
          <React.Fragment>
            Minimum approval %
            <Help hint="What is Minimum Approval?">
              <strong>Minimum Approval</strong> is the percentage of the total{' '}
              {tokenSymbol || 'token'} supply that is required to vote “Yes” on
              a proposal before it can be approved. For example, if the “Minimum
              Approval” is set to 20%, then more than 20% of the outstanding{' '}
              {tokenSymbol || 'token'} supply must vote “Yes” on a proposal for
              it to pass.
            </Help>
          </React.Fragment>
        }
        value={quorum}
        onChange={handleQuorumChange}
      />

      <Duration
        duration={duration}
        onUpdate={handleDurationChange}
        label={
          <React.Fragment>
            Vote duration
            <Help hint="What is Vote Duration?">
              <strong>Vote Duration</strong> is the length of time that
              management's votes will be open for participation. For example, if
              the Vote Duration is set to 24 hours, then management members will
              have 24 hours to participate in the vote.
            </Help>
          </React.Fragment>
        }
      />
      {formError && (
        <Info
          mode="error"
          css={`
            margin-bottom: ${3 * GU}px;
          `}
        >
          {formError}
        </Info>
      )}

      <Navigation
        backEnabled
        nextEnabled={!disableNext}
        nextLabel={`Next: ${screens[screenIndex + 1][0]}`}
        onBack={back}
        onNext={handleSubmit}
      />
    </form>
  )
}

Management.propTypes = {
  dataKey: PropTypes.string,
  screenProps: ScreenPropsType.isRequired,
  title: PropTypes.string,
}

Management.defaultProps = {
  dataKey: 'management',
  title: 'Configure management',
}

Management.formatReviewFields = formatReviewFields

function Subtitle({ content }) {
  const theme = useTheme()

  return (
    <h4
      css={`
        ${textStyle('title4')};
        color: ${theme.contentSecondary};
        margin-bottom: ${3 * GU}px;
      `}
    >
      {content}
    </h4>
  )
}

Subtitle.propTypes = {
  content: PropTypes.any,
}
function MemberField({ index, member, hideRemoveButton, onUpdate, onRemove }) {
  const theme = useTheme()
  const fieldsLayout = useFieldsLayout()

  const account = member

  const handleRemove = useCallback(() => {
    onRemove(index)
  }, [onRemove, index])

  const handleAccountChange = useCallback(
    event => {
      onUpdate(index, event.target.value)
    },
    [onUpdate, index]
  )

  return (
    <div
      className="member"
      css={`
        ${fieldsLayout};
        position: relative;
        margin-bottom: ${1.5 * GU}px;
      `}
    >
      <div>
        <TextInput
          adornment={
            <span css="transform: translateY(1px)">
              {!hideRemoveButton && (
                <Button
                  display="icon"
                  icon={
                    <IconTrash
                      css={`
                        color: ${theme.negative};
                      `}
                    />
                  }
                  label="Remove"
                  onClick={handleRemove}
                  size="mini"
                />
              )}
            </span>
          }
          adornmentPosition="end"
          adornmentSettings={{ width: 52, padding: 8 }}
          onChange={handleAccountChange}
          placeholder="Ethereum address"
          value={account}
          wide
          css={`
            padding-left: ${4.5 * GU}px;
          `}
        />
        <div
          css={`
            position: absolute;
            top: ${1 * GU}px;
            left: ${1 * GU}px;
          `}
        >
          {isAddress(account) ? (
            <EthIdenticon address={account} radius={RADIUS} />
          ) : (
            <div
              css={`
                width: ${3 * GU}px;
                height: ${3 * GU}px;
                background: ${theme.disabled};
                border-radius: ${RADIUS}px;
              `}
            />
          )}
        </div>
      </div>
    </div>
  )
}

MemberField.propTypes = {
  hideRemoveButton: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  member: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

function formatReviewFields(screenData) {
  return [
    [
      'Token name & symbol',
      `${screenData.tokenName} (${screenData.tokenSymbol})`,
    ],
    ...screenData.members.map((account, i) => [
      `Tokenholder #${i + 1}`,
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <IdentityBadge entity={account} />
        <span
          css={`
            margin-left: ${2 * GU}px;
          `}
        />
      </div>,
    ]),
    ['Support %', `${screenData.support}%`],
    ['Minimum approval %', `${screenData.quorum}%`],
    ['Vote duration', formatDuration(screenData.duration)],
  ]
}

export default Management
