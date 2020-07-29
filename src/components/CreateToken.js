import React from 'react';
import { Layout, Spin, Form, Input, Button, Divider, Select, Switch, Icon, Typography, Alert, Row, Col, message } from 'antd';
import { utils as web3Utils } from 'web3';

const { Option } = Select
const { Item } = Form;
const { Text, Title, Paragraph } = Typography;

export default function CreateToken({ Form, CreateTokenSymbol, formItemLayout, reservations, createToken, getFieldDecorator, resetFields, walletAddress }) {
  return (
    <div className="container d-flex justify-content-center mb-5">
      {reservations &&
        <Form colon={false} style={{ maxWidth: 600 }} {...formItemLayout}
          onSubmit={createToken}>
          <Title level={2} style={{ margin: 25 }}>Create Your Security Token</Title>
          <Paragraph style={{ margin: 25 }}>Create your security token using one of your previous symbol reservations. If you let your token reservation expire, the token symbol you selected will be available for others to claim.</Paragraph>
          <Item
            style={{ textAlign: 'left', marginBottom: 25 }}
            name="symbol"
            label="Reservation">
            {getFieldDecorator('symbol', {
              rules: [{ required: true, message: 'A token reservation is required' }],
            })(<Select
              placeholder="Select a reservation">
              {reservations.map(({ symbol }) =>
                <Option key={symbol} value={symbol}>{symbol}</Option>)}
            </Select>)}
          </Item>
          <Item
            style={{ textAlign: 'left', marginBottom: 25 }}
            name="name"
            label="Token Name"
            extra="This is the name of your token for display purposes. For example: Toro Token">
            {getFieldDecorator('name', {
              rules: [{ required: true, message: 'Token name is required' }, { max: 64 }],
            })(<Input placeholder="Enter Token Name" />)}
          </Item>
          <Item
            style={{ textAlign: 'left', marginBottom: 25 }}
            name="detailsUrl"
            label="Token Details"
            extra="Paste a link to a web page that includes additional information on your token, such as legend.">
            {getFieldDecorator('detailsUrl', { initialValue: '' })(<Input placeholder="Paste link here" />)}
          </Item>
          <Item
            style={{ textAlign: 'left', marginBottom: 25 }}
            name="treasuryWallet"
            label="Treasury Wallet Address"
            extra="Address of a wallet to be used to store tokens for some operations. Defaults to current user (eg Token Issuer) address">
            {getFieldDecorator('treasuryWallet', {
              initialValue: walletAddress,
              rules: [
                { required: true },
                {
                  validator: (rule, value, callback) => {
                    if (!web3Utils.isAddress(value)) {
                      callback('Address is invalid')
                      return
                    }
                    callback()
                    return
                  }
                }
              ]
            })(<Input />)}
          </Item>
          <Item
            style={{ textAlign: 'left', marginBottom: 25 }}
            name="divisible"
            label="Divisible"
            extra="Indivisible tokens are typically used to represent an equity, while divisible tokens may be used to represent divisible assets such as bonds. Please connect with your advisor to select the best option..">
            {getFieldDecorator('divisible', {
              initialValue: false,
              valuePropName: 'checked',
            })(<Switch style={{ float: 'left' }} />)}
          </Item>

          <div style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}><Button style={{ width: '100%' }} htmlType="reset" onClick={() => resetFields()}>
                Reset fields
                    </Button></Col>
              <Col span={12}> <Button type="primary" style={{ width: '100%' }} htmlType="submit">
                Create my token
                    </Button></Col>
            </Row>
          </div>
        </Form>
      }
    </div>
  )
}
