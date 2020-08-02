import React, { useReducer, useEffect, Fragment } from 'react'
import { Layout, Select, Spin, Alert, Icon, Typography } from 'antd'
import { Polymath, browserUtils } from '@polymathnetwork/sdk'
import moment from 'moment'

import DispatchContext from '../../index'
import a from './actions'
import TokenSelector from './TokenSelector'
import WhiteList from './WhiteList'
import { networkConfigs } from './config'

const { Content, Header } = Layout
const { Option } = Select
const { Text } = Typography

const initialState = {
  tokenholders: [],
  tokens: undefined,
  editingTokenholder: false,
  selectedToken: undefined,
  fetching: false,
  walletAddress: '',
  polyClient: undefined,
  connected: false,
  error: '',
  networkId: 0,
  tip: ''
}

function reducer(state, action) {
  console.log('ACTION', action)
  switch (action.type) {
    case a.CONNECTING:
      return {
        ...state,
        connecting: true, // Spinner will keep on spinning until connection has established.
        tip: 'Connecting...', // Message to display while connecting.
        error: undefined // Clear previous error, if any.
      }
    case a.CONNECTED:
      const { polyClient, networkId, walletAddress } = action
      return {
        ...state,
        polyClient,
        networkId,
        walletAddress,
        connecting: false,
        tip: '',
        error: undefined,
      }
    case a.CONNECTION_ERROR:
      const { error } = action
      return {
        ...state,
        error,
        tokens: undefined,
        connecting: false,
        tip: '',
      }
    case a.FETCHING_TOKENS:
      return {
        ...state,
        fetching: true,
        tip: 'Fetching tokens'
      }
    case a.FETCHED_TOKENS:
      const { tokens, tokenSelectOpts } = action
      return {
        ...state,
        tokenSelectOpts,
        tokens,
        fetching: false,
        tip: ''
      }
    case a.TOKEN_SELECTED:
      const { selectedToken } = action
      return {
        ...state,
        selectedToken,
        tip: 'Loading tokenholders...',
        fetching: true
      }
    case a.RELOAD_TOKENHOLDERS:
      return {
        ...state,
        fetching: true,
        tip: 'Reloading tokenholders...',
        reloadTokenholders: true,
      }
    case a.TOKENHOLDERS_FETCHED:
      let { tokenholders } = action
      tokenholders = tokenholders.map(tokenholder => {
        const ret = Object.assign({}, tokenholder, {
          canReceiveAfter: moment(tokenholder.canReceiveAfter),
          canSendAfter: moment(tokenholder.canSendAfter),
          kycExpiry: moment(tokenholder.kycExpiry)
        })
        return ret
      })
      return {
        ...state,
        tokenholders,
        fetching: false,
        tip: '',
        reloadTokenholders: false,
      }
    case a.DELETING_TOKENHOLDER:
      return {
        ...state,
        fetching: true,
        tip: 'Deleting token holder'
      }
    case a.TOKENHOLDER_DELETED:
      return {
        ...state,
        fetching: false,
        tip: ''
      }
    case a.ERROR:
      const { error: error2 } = action
      return {
        ...state,
        error: error2,
        fetching: false
      }
    default:
      throw new Error(`Unrecognized action "${action.type}"`)
  }
}

function Network({ networkId }) {
  networkId = networkId.toString()
  const networks = {
    0: 'Disconnected',
    1: 'Mainnet',
    42: 'Kovan'
  }
  return (
    <Fragment>
      <Icon type="global" style={{
        marginRight: 10,
        marginLeft: 20
      }} />
      <Text>{networks[networkId]}</Text>
    </Fragment>
  )
}

function User({ walletAddress }) {
  if (walletAddress)
    return (
      <Fragment>
        <Icon type="user" style={{
          marginRight: 5,
          marginLeft: 10
        }} />
        <Text>{walletAddress}</Text>
      </Fragment>
    )
  return null
}

function Selector() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {
    tokenholders,
    tokens,
    selectedToken,
    fetching,
    tip,
    walletAddress,
    connecting,
    error,
    networkId,
    connected,
    polyClient,
    reloadTokenholders,
    tokenSelectOpts
  } = state

  // A. Connect to Polymath ecosystem
  useEffect(() => {
    async function connect(dispatch) {
      // A1. Start the spinner!
      dispatch({ type: a.CONNECTING })

      try {
        // A2. Get the current network and make sure it's either Mainnet or Kovan.
        const networkId = await browserUtils.getNetworkId()
        const walletAddress = await browserUtils.getCurrentAddress()
        if (![-1, 1, 42].includes(networkId)) {
          dispatch({
            type: a.CONNECTION_ERROR,
            error: 'Please switch to either Main or Kovan network'
          })
          return
        }

        // A3. Instantiate and configure the SDK. Then, dispatch CONNECTED action with
        // the necessary state variables. This should also stop the snipper.
        const config = networkConfigs[networkId]
        const polyClient = new Polymath()
        await polyClient.connect(config)
        dispatch({
          type: a.CONNECTED,
          networkId,
          polyClient,
          walletAddress,
        })
      }
      catch (error) {
        // A4. Dispatch ERROR action in order to display any errors thrown in the process.
        dispatch({
          type: a.CONNECTION_ERROR,
          error: error.message
        })
      }
    }

    // Attempt to connect but only if we haven't connected yet.
    if (!connected) {
      connect(dispatch)
    }
  }, [connected])

  // b. Fetch tokens
  useEffect(() => {
    async function fetchTokens(dispatch, polyClient, walletAddress) {
      dispatch({ type: a.FETCHING_TOKENS })
      const tokens = await polyClient.getSecurityTokens({ walletAddress })
      const tokenSelectOpts = tokens.map((token, i) =>
        <Option value={i} key={i}>{token.symbol}</Option>)

      dispatch({ type: a.FETCHED_TOKENS, tokens, tokenSelectOpts })
    }
    if (polyClient && walletAddress && !tokens) {
      fetchTokens(dispatch, polyClient, walletAddress)
    }
  }, [walletAddress, polyClient, tokens])

  // c. Fetch share holders.
  useEffect(() => {
    async function fetchTokenholders(dispatch, st) {
      let tokenholders = await st.tokenholders.getTokenholders()
      dispatch({ type: a.TOKENHOLDERS_FETCHED, tokenholders })
    }
    if (reloadTokenholders === true | selectedToken !== undefined) {
      fetchTokenholders(dispatch, tokens[selectedToken])
    }
  }, [tokens, selectedToken, reloadTokenholders])

  async function modifyWhitelist(data) {
    const queue = await tokens[selectedToken].tokenholders.modifyData({
      tokenholderData: data
    })
    await queue.run()
    dispatch({ type: a.RELOAD_TOKENHOLDERS })
  }

  async function removeTokenholders(addresses) {
    dispatch({ type: a.DELETING_TOKENHOLDER })
    try {
      const queue = await tokens[selectedToken].tokenholders.revokeKyc({
        tokenholderAddresses: addresses
      })
      await queue.run()
      dispatch({ type: a.TOKENHOLDER_DELETED })
    }
    catch (error) {

    }
    dispatch({ type: a.RELOAD_TOKENHOLDERS })
  }

  return (
    <div className="d-flex justify-content-center">
      <DispatchContext.Provider value={dispatch}>
        <Spin spinning={fetching || connecting} tip={tip} size="large">
          <Layout>
            {/* <Header style={{
              backgroundColor: 'white',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <Network networkId={networkId} />
              <User walletAddress={walletAddress} />
            </Header> */}
            <Content style={{
              padding: 50,
              backgroundColor: '#FAFDFF'
            }}>
              {error &&
                <Alert
                  message={error}
                  type="error" />
              }
              {walletAddress &&
                <TokenSelector
                  tokenSelectOpts={tokenSelectOpts} />
              }
              {selectedToken !== undefined &&
                <WhiteList
                  modifyWhitelist={modifyWhitelist}
                  removeTokenholders={removeTokenholders}
                  tokenholders={tokenholders} />
              }
            </Content>
          </Layout>
        </Spin>
      </DispatchContext.Provider>
    </div>
  )
}

export default Selector
