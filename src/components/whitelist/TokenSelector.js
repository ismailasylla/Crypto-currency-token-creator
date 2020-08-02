import React, { useContext } from 'react'
import { Select, Typography } from 'antd'

import actions from './actions'
import DispatchContext from '../../index'
const { Text, Title } = Typography

export default function TokenSelector({ tokenSelectOpts }) {
  const dispatch = useContext(DispatchContext)
  return (<div style={{
    display: 'flex',
    flexDirection: 'column',
    width: 250,
    justifyContent: 'flex-start'
  }}>
    <Title level={3}>Please Select a Token</Title>
    <Text style={{
      paddingTop: 20,
      paddingBottom: 20,
      width: '100%'
    }}>
      Once you select a token, you will be able to manage token holders white-list by adding,
      editing or removing token holders.
    </Text>
    <Select
      autoFocus
      showSearch
      style={{
        width: '100%',
        marginBottom: 40
      }}
      placeholder="Select a token"
      optionFilterProp="children"
      onChange={(index) => dispatch({
        type: actions.TOKEN_SELECTED,
        selectedToken: index
      })}
      filterOption={(input, option) =>
        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {tokenSelectOpts}
    </Select>
  </div>)
}