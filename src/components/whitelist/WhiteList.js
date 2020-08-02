import React, { useEffect, useReducer } from 'react';
import useForm from 'rc-form-hooks';
import moment from 'moment';
import { utils as web3Utils } from 'web3';
import { filter } from 'p-iteration'
import {
  Button,
  Form,
  Input,
  DatePicker,
  Modal,
  Spin,
  message,
  Switch,
} from 'antd';
import { Table, Typography, Icon } from 'antd';

const { Fragment } = React;
const { Item } = Form;

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

const defaultTokenholderValues = {
  address: '',
  canSendAfter: moment().add(1, 'hour'),
  canReceiveAfter: moment().add(1, 'hour'),
  kycExpiry: moment().add(1, 'year'),
  canBuyFromSto: true,
  isAccredited: false,
};

const initialState = {
  editIndex: '',
  visible: false,
  ongoingTx: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_FORM':
      const { editIndex } = action.payload;
      return {
        ...state,
        visible: true,
        editIndex,
      };
    case 'CLOSE_FORM':
      return {
        ...state,
        editIndex: '',
        visible: false,
        ongoingTx: false,
      };
    case 'TX_SEND':
      return {
        ...state,
        ongoingTx: true,
      };
    case 'TX_RECEIPT':
      return {
        ...state,
        ongoingTx: false,
        visible: false,
        error: '',
        editIndex: '',
      };
    case 'TX_ERROR':
      const { error } = action.payload;
      return {
        ...state,
        error,
        ongoingTx: false,
      };
    default:
      return state;
  }
};

const { Column } = Table;
const { Text } = Typography;

function formatDate(input) {
  return moment(input).format('YYYY-MM-DD');
}

function formatBool(input) {
  return input ? (
    <Fragment>
      <Icon style={{ color: '#00AA5E' }} type="check-circle" theme="filled" />
      <span style={{ paddingLeft: 10 }}>Yes</span>
    </Fragment>
  ) : (
      <Fragment>
        <Icon style={{ color: '#DB2C3E' }} type="close-circle" theme="filled" />
        <span style={{ paddingLeft: 10 }}>No</span>
      </Fragment>
    );
}

export const TokenholdersTable = ({
  tokenholders,
  openForm,
  removeTokenholders,
}) => {
  return (
    <Table dataSource={tokenholders} rowKey="address">
      <Column
        title="Address"
        dataIndex="address"
        key="address"
        render={(text) => <Text>{web3Utils.toChecksumAddress(text)}</Text>}
      />
      <Column
        title="Can send after"
        dataIndex="canSendAfter"
        key="canSendAfter"
        render={(text) => formatDate(text)}
      />
      <Column
        title="Can receive after"
        dataIndex="canReceiveAfter"
        key="canReceiveAfter"
        render={(text) => formatDate(text)}
      />
      <Column
        title="KYC expiry"
        dataIndex="kycExpiry"
        key="kycExpiry"
        render={(text) => formatDate(text)}
      />
      <Column
        title="Can buy from STO"
        dataIndex="canBuyFromSto"
        key="canBuyFromSto"
        render={(text) => formatBool(text)}
      />
      <Column
        title="Is accredited"
        dataIndex="isAccredited"
        key="isAccredited"
        render={(text) => formatBool(text)}
      />
      <Column
        render={(text, record) => {
          return (
            <Fragment>
              <Button onClick={() => openForm(record.address)}>
                <Icon type="edit" theme="filled" />
              </Button>
              <Button onClick={() => removeTokenholders([record.address])}>
                <Icon type="delete" theme="filled" />
              </Button>
            </Fragment>
          );
        }}
      />
    </Table>
  );
};

export default ({ modifyWhitelist, tokenholders, removeTokenholders }) => {
  const form = useForm();
  const {
    getFieldDecorator,
    setFieldsValue,
    resetFields,
    validateFields,
  } = form;
  const [state, dispatch] = useReducer(reducer, initialState);
  const { visible, editIndex, ongoingTx } = state;

  const tokenholderExists = (address) => {
    const ret =
      tokenholders.find(
        (element) => element.address.toUpperCase() === address.toUpperCase()
      ) !== undefined;
    return ret;
  };

  const closeForm = () => {
    dispatch({ type: 'CLOSE_FORM' });
    resetFields();
  };

  const openForm = (index = '') => {
    dispatch({ type: 'OPEN_FORM', payload: { editIndex: index } });
  };

  const submitForm = async () => {
    const fields = [
      'address',
      'canSendAfter',
      'canReceiveAfter',
      'kycExpiry',
      'canBuyFromSto',
      'isAccredited',
    ];
    validateFields(fields, { force: true }).then(async (values) => {
      dispatch({ type: 'TX_SEND' });

      values.canSendAfter = values.canSendAfter.toDate();
      values.canReceiveAfter = values.canReceiveAfter.toDate();
      values.kycExpiry = values.kycExpiry.toDate();

      try {
        await modifyWhitelist([values]);
        dispatch({ type: 'TX_RECEIPT' });
        resetFields();
      } catch (error) {
        dispatch({ type: 'TX_ERROR', payload: { error: error.message } });
        message.error(error.message);
      }
    });
  };

  let editedRecord = tokenholders.filter(
    (tokenholder) => tokenholder.address === editIndex
  )[0];

  useEffect(() => {
    let initialValues = editedRecord || defaultTokenholderValues;
    setFieldsValue(initialValues);
  }, [editedRecord, setFieldsValue]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Button
        type="primary"
        style={{ marginBottom: 20, alignSelf: 'flex-end' }}
        onClick={openForm}
      >
        Add new
      </Button>
      <TokenholdersTable
        tokenholders={tokenholders}
        removeTokenholders={removeTokenholders}
        openForm={openForm}
      />
      <Modal
        title={editedRecord ? 'Edit token holder' : 'Add a new token holder'}
        okText="Save"
        closable={false}
        visible={visible}
        footer={null}
      >
        <Spin spinning={ongoingTx} size="large">
          <Form {...formItemLayout}>
            <Item name="address" label="Address">
              {getFieldDecorator('address', {
                rules: [
                  { required: true },
                  {
                    validator: (rule, value, callback) => {
                      if (!editedRecord && !web3Utils.isAddress(value)) {
                        callback('Address is invalid');
                        return;
                      }
                      callback();
                      return;
                    },
                  },
                  {
                    validator: (rule, value, callback) => {
                      if (!editedRecord && tokenholderExists(value)) {
                        callback(
                          'Tokenholder is already present in the whitelist'
                        );
                        return;
                      }
                      callback();
                      return;
                    },
                  },
                ],
              })(<Input disabled={!!editedRecord} />)}
            </Item>
            <Item name="canSendAfter" label="Can Send after">
              {getFieldDecorator('canSendAfter', {
                rules: [{ required: true }],
              })(<DatePicker />)}
            </Item>
            <Item name="canReceiveAfter" label="Can Receive After">
              {getFieldDecorator('canReceiveAfter', {
                rules: [{ required: true }],
              })(<DatePicker />)}
            </Item>
            <Item name="kycExpiry" label="KYC Expiry">
              {getFieldDecorator('kycExpiry', {
                rules: [{ required: true }],
              })(<DatePicker />)}
            </Item>
            <Item name="canBuyFromSto" label="Can Buy from STO">
              {getFieldDecorator('canBuyFromSto', {
                valuePropName: 'checked',
              })(<Switch />)}
            </Item>
            <Item name="isAccredited" label="Accredited">
              {getFieldDecorator('isAccredited', {
                valuePropName: 'checked',
              })(<Switch />)}
            </Item>
            <Item>
              <Button onClick={closeForm}>cancel</Button>
              <Button onClick={submitForm}>save</Button>
            </Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};
