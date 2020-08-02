import React, { useContext, useEffect, useState, Fragment } from 'react';
import { Store } from './index';
import {
  usePolymathSdk,
  User,
  Network,
  useTokenSelector,
} from '@polymathnetwork/react';
import { Polymath, browserUtils } from '@polymathnetwork/sdk';
import {
  Layout,
  Spin,
  Form,
  Badge,
  Input,
  Button,
  Descriptions,
  Divider,
  Select,
  Icon,
  Typography,
  Alert,
  Row,
  Col,
  message,
} from 'antd';
import { Feature } from '@polymathnetwork/sdk';
import useForm from 'rc-form-hooks';
import { filter } from 'p-iteration';
import CreateToken from './components/CreateToken';
import CreateTokenSymbol from './components/CreateTokenSymbol';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './images/logo/logoblue.png';
import NavBar from './components/NavBar';
import { Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import DispatchContext from './index';
import Selector from './components/whitelist/Selector';
import PMDisplay from './components/permissions/PMDisplay';
import { _split } from './index';

const { Content, Header, Sider } = Layout;
const PERMISSIONS_FEATURE = Feature.Permissions;

const { Text } = Typography;

const networkConfigs = {
  1: {
    polymathRegistryAddress: '0xdfabf3e4793cd30affb47ab6fa4cf4eef26bbc27',
  },
  42: {
    polymathRegistryAddress: '0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3',
  },
  15: {
    polymathRegistryAddress: '0x9FBDa871d559710256a2502A2517b794B482Db40',
  },
};

message.config({
  duration: 5,
  maxCount: 1,
  top: 150,
});

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

export const reducer = (state, action) => {
  console.log('ACTION', action);
  switch (action.type) {
    case 'INITALIZING':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Initializing Polymath SDK',
        error: undefined,
      };
    case 'INITIALIZED':
      const { sdk, networkId, walletAddress } = action;
      return {
        ...state,
        loading: false,
        loadingMessage: '',
        error: undefined,
        sdk,
        networkId,
        walletAddress,
      };
    case 'FETCHING_RESERVATIONS':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Fetching your previously reserved symbols',
        error: undefined,
      };
    case 'RESERVING_SYMBOL':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Reserving symbol',
      };
    case 'RESERVED_SYMBOL':
      return {
        ...state,
        loading: true,
        reservations: undefined,
        loadingMessage: 'Refreshing reservations',
      };
    case 'CREATING_TOKEN':
      return {
        ...state,
        loading: true,
        loadingMessage: 'Creating token',
      };
    case 'CREATED_TOKEN':
      return {
        ...state,
        loading: true,
        reservations: undefined,
        loadingMessage: 'Refreshing reservations',
      };
    case 'FETCHED_RESERVATIONS':
      const { reservations } = action;
      return {
        ...state,
        loading: false,
        loadingMessage: '',
        error: undefined,
        reservations,
      };
    case 'ERROR':
      const { error } = action;
      return {
        ...state,
        loading: false,
        loadingMessage: '',
        error,
      };
    case 'ASYNC_START':
      return {
        ...state,
        loading: true,
        loadingMessage: action.msg,
        error: undefined,
      };
    case 'ASYNC_COMPLETE':
      const { type, ...payload } = action;
      return {
        ...state,
        ...payload,
        loading: false,
        loadingMessage: '',
        error: undefined,
      };
    case 'TOKEN_SELECTED':
      return {
        ...state,
        delegates: undefined,
        records: undefined,
        pmEnabled: undefined,
        error: undefined,
        features: undefined,
      };
    default:
      throw new Error(`Unrecognized action type: ${action.type}`);
  }
};

// Permissions
function Features({ features, pmEnabled, onClick }) {
  return (
    <Descriptions column={4} style={{ marginBottom: 50 }}>
      <Descriptions.Item key="Permissions" label="Permissions">
        {pmEnabled ? (
          <Badge status="success" text="enabled" />
        ) : (
          <Button type="primary" onClick={onClick}>
            Enable
          </Button>
        )}
      </Descriptions.Item>

      {Object.keys(features).map((feat) => {
        return (
          <Descriptions.Item key={feat} label={_split(feat)}>
            <Badge
              status={features[feat] ? 'success' : 'error'}
              text={features[feat] ? 'enabled' : 'disabled'}
            />
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );
}

async function asyncAction(dispatch, func, msg = '') {
  try {
    dispatch({ type: 'ASYNC_START', msg });
    const rets = await func();
    dispatch({ type: 'ASYNC_COMPLETE', ...rets });
  } catch (error) {
    dispatch({ type: 'ASYNC_ERROR', error: error.message });
  }
}

// function Network({ networkId }) {
//   networkId = networkId.toString();
//   const networks = {
//     0: 'Disconnected',
//     1: 'Mainnet',
//     42: 'Kovan',
//   };
//   return (
//     <Fragment>
//       <Icon
//         type="global"
//         style={{
//           marginRight: 10,
//           marginLeft: 20,
//         }}
//       />
//       <Text>{networks[networkId]}</Text>
//     </Fragment>
//   );
// }

// function User({ walletAddress }) {
//   if (walletAddress)
//     return (
//       <Fragment>
//         <Icon
//           type="user"
//           style={{
//             marginRight: 5,
//             marginLeft: 10,
//           }}
//         />
//         <Text>{walletAddress}</Text>
//       </Fragment>
//     );
//   return null;
// }

function App() {
  const [state, dispatch] = useContext(Store);
  let {
    sdk,
    loading,
    loadingMessage,
    reservations,
    walletAddress,
    error,
    networkId,
    features,
    pmEnabled,
    records,
    availableRoles,
  } = state.AppReducer;
  const [formSymbolValue, setFormSymbolValue] = useState('');
  const form = useForm();
  const { getFieldDecorator, resetFields, validateFields } = form;
  // Initialize the SDK.

  let {
    error: sdkError,
    // sdk,
    // walletAddress,
    // error,
    // loadingMessage,
  } = usePolymathSdk();
  let {
    error: tokenSelectorError,
    tokenSelector,
    tokens,
    tokenIndex,
  } = useTokenSelector(sdk, walletAddress);
  const token = tokens[tokenIndex];

  error = error || sdkError || tokenSelectorError;
  if (!error && !loadingMessage) {
    if (!sdk) {
      loading = true;
      loadingMessage = 'Initializing Polymath SDK';
    } else if (!tokens.length) {
      loading = true;
      loadingMessage = 'Loading your security tokens';
    }
  }

  useEffect(() => {
    async function init() {
      dispatch({ type: 'INITALIZING' });

      try {
        const networkId = await browserUtils.getNetworkId();
        const walletAddress = await browserUtils.getCurrentAddress();
        if (![-1, 1, 42].includes(networkId)) {
          dispatch({
            type: 'ERROR',
            error: 'Please switch to either Main or Kovan network',
          });
          return;
        }

        const config = networkConfigs[networkId];
        const sdk = new Polymath();
        await sdk.connect(config);
        dispatch({
          type: 'INITIALIZED',
          networkId,
          sdk,
          walletAddress,
        });
      } catch (error) {
        dispatch({
          type: 'ERROR',
          error: error.message,
        });
      }
    }
    if (!sdk) {
      init();
    }
  }, [dispatch, sdk]);

  // Fetch previous reservations if any.
  useEffect(() => {
    async function fetchReservations() {
      dispatch({ type: 'FETCHING_RESERVATIONS' });
      try {
        let reservations = await sdk.getSecurityTokenReservations({
          owner: walletAddress,
        });
        reservations = await filter(reservations, async (reservation) => {
          const launched = await reservation.isLaunched();
          return !launched;
        });
        dispatch({ type: 'FETCHED_RESERVATIONS', reservations });
      } catch (error) {
        dispatch({ type: 'ERROR', error: error.message });
      }
    }
    if (sdk && walletAddress && reservations === undefined) {
      fetchReservations();
    }
    // eslint-disable-next-line
  }, [reservations, sdk, walletAddress]);

  // @TODO refactor into an effect
  async function reserveSymbol() {
    if (formSymbolValue) {
      dispatch({ type: 'RESERVING_SYMBOL' });
      try {
        const q = await sdk.reserveSecurityToken({ symbol: formSymbolValue });
        const ret = await q.run();
        dispatch({ type: 'RESERVED_SYMBOL' });
        message.success(
          `Symbol ${formSymbolValue} has been reserved successfully!`
        );
      } catch (error) {
        dispatch({ type: 'ERROR', error: error.message });
      }
    } else {
      message.error('Please provide a symbol');
    }
  }

  async function createToken(e) {
    e.preventDefault();
    const fields = [
      'symbol',
      'name',
      'detailsUrl',
      'treasuryWallet',
      'divisible',
    ];
    validateFields(fields, { force: true }).then(async (values) => {
      dispatch({ type: 'CREATING_TOKEN' });
      const reservation = reservations.filter(
        (r) => r.symbol === values.symbol
      )[0];

      try {
        const q = await reservation.createSecurityToken(values);
        const ret = await q.run();
        dispatch({ type: 'CREATED_TOKEN' });
        message.success(
          `Token ${reservation.symbol} has been created successfully!`
        );
        resetFields();
      } catch (error) {
        dispatch({
          type: 'ERROR',
          error: error.message,
        });
      }
    });
  }

  // Load features status / available roles
  useEffect(() => {
    async function getFeaturesStatus() {
      const featuresStatus = await token.features.getStatus();
      let availableRoles = [];
      const pmEnabled = featuresStatus[PERMISSIONS_FEATURE];
      delete featuresStatus[PERMISSIONS_FEATURE];
      if (pmEnabled) {
        availableRoles = await token.permissions.getAvailableRoles();
      }
      return {
        availableRoles,
        features: featuresStatus,
        pmEnabled,
      };
    }
    if (token && !features) {
      asyncAction(
        dispatch,
        () => getFeaturesStatus(),
        'Loading features status'
      );
    }
  }, [dispatch, features, token]);

  // Load delegates
  useEffect(() => {
    async function getDelegates() {
      const delegates = await token.permissions.getAllDelegates();
      const records = delegates.reduce((acc, delegate, i) => {
        return acc.concat(
          delegate.roles.map((role) => ({
            address: delegates[i].address,
            description: delegates[i].description,
            role,
          }))
        );
      }, []);
      return {
        delegates,
        records,
      };
    }
    if (token && pmEnabled) {
      asyncAction(dispatch, () => getDelegates(), 'Loading delegates');
    }
  }, [pmEnabled, dispatch, token]);

  async function togglePM(enable) {
    try {
      dispatch({ type: 'ASYNC_START', msg: 'Toggle role management' });
      if (enable) {
        // Enable module
        const queue = await token.features.enable({
          feature: PERMISSIONS_FEATURE,
        });
        await queue.run();
      } else {
        // Disable module
        const queue = await token.features.disable({
          feature: PERMISSIONS_FEATURE,
        });
        await queue.run();
      }
      dispatch({ type: 'ASYNC_COMPLETE', pmEnabled: !enable });
      dispatch({ type: 'TOKEN_SELECTED' });
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'ASYNC_ERROR',
        error: error.message,
      });
    }
  }

  const revokeRole = async (address, role) => {
    try {
      dispatch({
        type: 'ASYNC_START',
        msg: `Revoking ${role} role from ${address}`,
      });
      const queue = await token.permissions.revokeRole({
        delegateAddress: address,
        role,
      });
      await queue.run();
      dispatch({ type: 'ASYNC_COMPLETE' });
      dispatch({ type: 'TOKEN_SELECTED' });
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'ASYNC_ERROR',
        error: error.message,
      });
    }
  };

  const assignRole = async (address, role, description) => {
    try {
      dispatch({
        type: 'ASYNC_START',
        msg: `Assigning ${role} role to ${address}`,
      });
      const queue = await token.permissions.assignRole({
        delegateAddress: address,
        role,
        description,
      });
      await queue.run();
      dispatch({ type: 'ASYNC_COMPLETE' });
      dispatch({ type: 'TOKEN_SELECTED' });
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'ASYNC_ERROR',
        error: error.message,
      });
    }
  };

  return (
    <div className="background">
      <DispatchContext.Provider value={dispatch}>
        <NavBar />
        {/* <img className="logo logohover mt-5" src={logo} alt="Logo" /> */}
        <Divider />
        <Spin spinning={loading} tip={loadingMessage} size="large">
          <h3> Your Address</h3>
          <i class="fas fa-arrow-alt-circle-down"></i>
          <div className="d-flex justify-content-center">
            <Header
              style={{
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Network networkId={networkId} />
              <User walletAddress={walletAddress} />
            </Header>
          </div>
          {/* logo */}

          <Divider />
          <Switch>
            <Route
              path="/createtoken"
              render={(props) => (
                <CreateToken
                  CreateToken={createToken}
                  Form={Form}
                  formItemLayout={formItemLayout}
                  reservations={reservations}
                  createToken={createToken}
                  getFieldDecorator={getFieldDecorator}
                  walletAddress={walletAddress}
                  resetFields={resetFields}
                  {...props}
                />
              )}
            />
            <Route
              path="/createsymbol"
              render={(props) => (
                <CreateTokenSymbol
                  Form={Form}
                  formItemLayout={formItemLayout}
                  formSymbolValue={formSymbolValue}
                  setFormSymbolValue={setFormSymbolValue}
                  reserveSymbol={reserveSymbol}
                />
              )}
            />

            <Route
              path="/whitelist-specifications"
              render={(props) => <Selector />}
            />
            <Route
              path="/permissions"
              render={(props) => (
                <Layout>
                  <Sider
                    width={350}
                    style={{
                      padding: 50,
                      backgroundColor: '#FAFDFF',
                    }}
                  >
                    {walletAddress && tokens && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: 250,
                          justifyContent: 'flex-start',
                        }}
                      >
                        {tokenSelector({
                          onTokenSelect: () =>
                            dispatch({ type: 'TOKEN_SELECTED' }),
                        })}
                      </div>
                    )}
                  </Sider>
                  <Content
                    style={{
                      padding: 50,
                      backgroundColor: '#FAFDFF',
                    }}
                  >
                    {error && (
                      <Alert message={error} type="error" closable showIcon />
                    )}
                    {token && features && (
                      <Fragment>
                        <Divider orientation="left">Token features</Divider>
                        <Features
                          features={features}
                          pmEnabled={pmEnabled}
                          onClick={togglePM}
                        />
                      </Fragment>
                    )}
                    {token && availableRoles && records && (
                      <React.Fragment>
                        <Divider orientation="left">
                          Delegates (administrators and operators)
                        </Divider>

                        <PMDisplay
                          records={records}
                          roles={availableRoles}
                          revokeRole={revokeRole}
                          assignRole={assignRole}
                        />
                      </React.Fragment>
                    )}
                  </Content>
                </Layout>
              )}
            />
          </Switch>
        </Spin>
      </DispatchContext.Provider>
    </div>
  );
}

export default App;
