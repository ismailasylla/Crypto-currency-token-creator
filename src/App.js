import React, { useContext, useEffect, useState, Fragment } from 'react'
import { Store } from './index'
import { Polymath, browserUtils } from '@polymathnetwork/sdk'
import { Layout, Spin, Form, Input, Button, Divider, Select, Switch, Icon, Typography, Alert, Row, Col, message } from 'antd'
import useForm from 'rc-form-hooks'
import { filter } from 'p-iteration'
import { utils as web3Utils } from 'web3';
import CreateToken from './components/CreateToken';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './images/logo/logo.png';

const { Option } = Select
const { Content, Header } = Layout
const { Item } = Form
const { Text, Title, Paragraph } = Typography

const networkConfigs = {
  1: {
    polymathRegistryAddress: '0xdfabf3e4793cd30affb47ab6fa4cf4eef26bbc27'
  },
  42: {
    polymathRegistryAddress: '0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3'
  },
  15: {
    polymathRegistryAddress: '0x9FBDa871d559710256a2502A2517b794B482Db40'
  }
}

message.config({
  duration: 5,
  maxCount: 1,
  top: 150,
})

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
}

export const reducer = (state, action) => {
  console.log('ACTION', action)
  switch (action.type) {
    case 'INITALIZING':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Initializing Polymath SDK',
        error: undefined,
      }
    case 'INITIALIZED':
      const { sdk, networkId, walletAddress } = action
      return {
        ...state,
        loading: false,
        loadingMessage: '',
        error: undefined,
        sdk,
        networkId,
        walletAddress
      }
    case 'FETCHING_RESERVATIONS':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Fetching your previously reserved symbols',
        error: undefined,
      }
    case 'RESERVING_SYMBOL':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Reserving symbol'
      }
    case 'RESERVED_SYMBOL':
      return {
        ...state,
        loading: true,
        reservations: undefined,
        loadingMessage: 'Refreshing reservations',
      }
    case 'CREATING_TOKEN':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Creating token'
      }
    case 'CREATED_TOKEN':
      return {
        ...state,
        loading: true,
        reservations: undefined,
        loadingMessage: 'Refreshing reservations',
      }
    case 'FETCHED_RESERVATIONS':
      const { reservations } = action
      return {
        ...state,
        loading: false,
        loadingMessage: '',
        error: undefined,
        reservations
      }
    case 'ERROR':
      const { error } = action
      return {
        ...state,
        loading: false,
        loadingMessage: '',
        error,
      }
    default:
      throw new Error(`Unrecognized action type: ${action.type}`)
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

function App() {
  const [state, dispatch] = useContext(Store)
  const { sdk, loading, loadingMessage, reservations, walletAddress, error, networkId } = state.AppReducer
  const [formSymbolValue, setFormSymbolValue] = useState('')

  const form = useForm()
  const { getFieldDecorator, resetFields, validateFields } = form
  // Initialize the SDK.
  useEffect(() => {
    async function init() {
      dispatch({ type: 'INITALIZING' })

      try {
        const networkId = await browserUtils.getNetworkId()
        const walletAddress = await browserUtils.getCurrentAddress()
        if (![-1, 1, 42].includes(networkId)) {
          dispatch({
            type: 'ERROR',
            error: 'Please switch to either Main or Kovan network'
          })
          return
        }

        const config = networkConfigs[networkId]
        const sdk = new Polymath()
        await sdk.connect(config)
        dispatch({
          type: 'INITIALIZED',
          networkId,
          sdk,
          walletAddress,
        })
      }
      catch (error) {
        dispatch({
          type: 'ERROR',
          error: error.message
        })
      }
    }
    if (!sdk) {
      init()
    }
  }, [dispatch, sdk])

  // Fetch previous reservations if any.
  useEffect(() => {
    async function fetchReservations() {
      dispatch({ type: 'FETCHING_RESERVATIONS' })
      try {
        let reservations = await sdk.getSecurityTokenReservations({ owner: walletAddress })
        reservations = await filter(reservations, async (reservation) => {
          const launched = await reservation.isLaunched()
          return !launched
        })
        dispatch({ type: 'FETCHED_RESERVATIONS', reservations })
      } catch (error) {
        dispatch({ type: 'ERROR', error: error.message })
      }
    }
    if (sdk && walletAddress && reservations === undefined) {
      fetchReservations()
    }
    // eslint-disable-next-line
  }, [reservations, sdk, walletAddress])

  // @TODO refactor into an effect
  async function reserveSymbol() {
    if (formSymbolValue) {
      dispatch({ type: 'RESERVING_SYMBOL' })
      try {
        const q = await sdk.reserveSecurityToken({ symbol: formSymbolValue })
        const ret = await q.run()
        dispatch({ type: 'RESERVED_SYMBOL' })
        message.success(`Symbol ${formSymbolValue} has been reserved successfully!`)
      } catch (error) {
        dispatch({ type: 'ERROR', error: error.message })
      }
    } else {
      message.error('Please provide a symbol')
    }
  }

  async function createToken(e) {
    e.preventDefault()
    const fields = ['symbol', 'name', 'detailsUrl', 'treasuryWallet', 'divisible']
    validateFields(fields, { force: true })
      .then(async (values) => {
        dispatch({ type: 'CREATING_TOKEN' })
        const reservation = reservations.filter(r => r.symbol === values.symbol)[0]

        try {
          const q = await reservation.createSecurityToken(values)
          const ret = await q.run()
          dispatch({ type: 'CREATED_TOKEN' })
          message.success(`Token ${reservation.symbol} has been created successfully!`)
          resetFields()
        }
        catch (error) {
          dispatch({
            type: 'ERROR',
            error: error.message
          })
        }
      })
  }

  return (
    <>
      <div className="d-flex justify-content-end">
        <Header style={{
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <Network networkId={networkId} />
          <User walletAddress={walletAddress} />
        </Header>
      </div>
      <div className="d-flex justify-content-center">
        <Spin spinning={loading} tip={loadingMessage} size="large">

          <Layout>
            <Content style={{
              padding: 50,
              backgroundColor: '#FAFDFF'
            }}>
              {error && <Alert
                message={error}
                type="error"
                closable
                showIcon
              />}
              <Form colon={false} style={{ maxWidth: 600 }} {...formItemLayout}>
                <img className="logo " src={logo} alt="Logo" />
                <Title level={2} style={{ margin: 25 }}>Reserve Your Token Symbol</Title>
                <Paragraph style={{ margin: 25 }}>Reservation ensures that no other organization can create a token symbol identical to yours using the Polymath platform. This operation carries a cost of: 250 POLY.</Paragraph>
                <Item name="symbol"
                  label="Symbol">
                  <Input
                    placeholder="SYMBOL"
                    value={formSymbolValue}
                    onChange={({ target: { value } }) => {
                      const pattern = RegExp('^[a-zA-Z0-9_-]*$')
                      if (pattern.test(value) && value.length <= 10) {
                        setFormSymbolValue(value.toUpperCase())
                      }
                    }}
                  />
                </Item>
                <Button className="" type="primary" style={{ width: '100%' }} onClick={reserveSymbol}>Reserve Symbol</Button>
              </Form>

              <Divider />
              <CreateToken
                CreateToken={createToken}
                Form={Form}
                formItemLayout={formItemLayout}
                reservations={reservations}
                createToken={createToken}
                getFieldDecorator={getFieldDecorator}
                walletAddress={walletAddress}
                resetFields={resetFields}
              />


            </Content>
          </Layout>
        </Spin>
      </div></>
  )
}

export default App
