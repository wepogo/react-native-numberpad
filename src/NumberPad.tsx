import * as React from 'react'
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

import {
  State as GestureState,
  TapGestureHandler,
} from 'react-native-gesture-handler'

// import styled from 'styled-components/native'

try {
  var KeyEvent = require('react-native-keyevent')
} catch (err) {
  KeyEvent = null
}

try {
  var ReactNavigation = require('react-navigation')
} catch (err) {
  ReactNavigation = null
}

// import KeyEvent from 'react-native-keyevent'
// import { NavigationEvents } from 'react-navigation'

// import { currency } from 'lib/currency'
import { valueAtSize } from './layout'

const { height } = Dimensions.get('window')

// TODO - calculate height based on common device sizes
const KEYBOARD_HEIGHT = height * 0.32

const El = styled(Animated.View)<{ showing: boolean }>`
  ${p =>
    p.showing &&
    `height: ${KEYBOARD_HEIGHT};
     margin-bottom: 15px;
     width: 100%;
     `}
  ${p =>
    !p.showing &&
    `position: absolute;
     bottom: 0;
     height: 1px;
     width: 1px;
    ${Platform.OS === 'ios' && 'left: -10px;'}
    `}
`
const HiddenTextInput = styled(TextInput)`
  height: 100%;
  width: 100%;
  opacity: 0;
  z-index: 1;
`
const Row = styled(View)`
  flex-direction: row;
  height: 25%;
  width: 100%;
`
const ValueContainer = styled(View)`
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: center;
`
const Value = styled(Animated.Text)`
  color: #4A4A4A;
  font-family: proximanova-medium;
  position: absolute;
`

interface Props {
  handleChange: (value: string) => void
  value: string

  disabled?: boolean
  getPrevField?: () => void
  hasAlpha?: boolean
  hasDecimal?: boolean
  // isCurrency?: boolean
  maxLength?: number
}

interface State {
  alpha: boolean
  decimal: boolean
  isShowing: boolean
}

interface ScaleValues {
  [key: string]: Animated.Value
}

export class NumberPad extends React.Component<Props, State> {
  private utilityKeyOpacity: any
  private numPadOpacity: Animated.Value
  private keyboardDidHideListener: any
  private keyboardDidShowListener: any
  private keyboardWillHideListener: any
  private keyboardWillShowListener: any
  private touchScaleValues: ScaleValues
  private deleteTimer: number = 0
  private longPressTimer: number = 0

  constructor(props: Props) {
    super(props)

    this.utilityKeyOpacity = new Animated.Value(1)
    this.numPadOpacity = new Animated.Value(1)

    const elements = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
      'ABC',
      '.',
      '❮',
    ]

    this.touchScaleValues = elements.reduce(
      (obj: { [key: string]: Animated.Value }, v) => {
        obj[v] = new Animated.Value(0)
        return obj
      },
      {}
    ) as ScaleValues

    this.state = {
      alpha: !!this.props.hasAlpha,
      decimal: !!this.props.hasDecimal,
      isShowing: true,
    }
  }

  private onFocus = () => {
    if (Platform.OS === 'android') {
      this.keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          this.animateScaleOut('ABC')
          this.showNumPad()
        }
      )

      this.keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          this.hideNumPad()
        }
      )
    }

    if (Platform.OS === 'ios') {
      this.keyboardWillHideListener = Keyboard.addListener(
        'keyboardWillHide',
        () => {
          this.animateScaleOut('ABC')
          this.showNumPad()
        }
      )

      this.keyboardWillShowListener = Keyboard.addListener(
        'keyboardWillShow',
        () => {
          this.hideNumPad()
        }
      )

      if (__DEV__) {
        KeyEvent.onKeyUpListener((keyEvent: KeyEvent.KeyEventProps) => {
          if (keyEvent.pressedKey.match(/[0-9]/)) {
            this.animateScaleIn(keyEvent.pressedKey)
            this.handleChange(keyEvent.pressedKey)
            setTimeout(() => this.animateScaleOut(keyEvent.pressedKey), 100)
          } else if (this.props.hasAlpha) {
            this.handleChange(keyEvent.pressedKey)
          }
        })
      }
    }
  }

  private onBlur = () => {
    if (Platform.OS === 'android') {
      this.keyboardDidHideListener.remove()
      this.keyboardDidShowListener.remove()
    }

    if (Platform.OS === 'ios') {
      this.keyboardWillHideListener.remove()
      this.keyboardWillShowListener.remove()
      if (__DEV__) {
        KeyEvent.removeKeyUpListener()
      }
    }
  }

  public componentDidUpdate = (prevProps: Props) => {
    if (this.props.hasAlpha !== prevProps.hasAlpha) {
      this.props.hasAlpha
        ? this.animateUtilityKeyIn('alpha')
        : this.animateUtilityKeyOut()
    }

    if (this.props.hasDecimal !== prevProps.hasDecimal) {
      this.props.hasDecimal
        ? this.animateUtilityKeyIn('decimal')
        : this.animateUtilityKeyOut()
    }
  }

  private animateUtilityKeyIn = (key: 'alpha' | 'decimal') => {
    const newState = { alpha: false, decimal: false }
    newState[key] = true
    this.setState(newState)

    this.utilityKeyOpacity.setValue(0)
    Animated.timing(this.utilityKeyOpacity, {
      duration: 250,
      toValue: 1,
    }).start()
  }

  private animateUtilityKeyOut = () => {
    Animated.timing(this.utilityKeyOpacity, {
      duration: 250,
      toValue: 0,
    }).start(() => this.setState({ alpha: false, decimal: false }))
  }

  private animateScaleIn = (value: string) => {
    Animated.spring(this.touchScaleValues[value], {
      bounciness: 12,
      speed: 20,
      toValue: 1,
    }).start()
  }

  private animateScaleOut = (value: string) => {
    Animated.spring(this.touchScaleValues[value], {
      bounciness: 12,
      speed: 20,
      toValue: 0,
    }).start()
  }

  private showNumPad = () => {
    this.numPadOpacity.setValue(0)
    this.setState({ isShowing: true })

    Animated.timing(this.numPadOpacity, {
      duration: 250,
      toValue: 1,
    }).start()
  }

  private hideNumPad = () => {
    this.setState({ isShowing: false })
  }

  private handleChange = (value: string) => {
    const oldVal = this.props.value
    const { getPrevField, maxLength } = this.props

    if (value === '.' && oldVal.includes('.')) {
      return
    }

    let newVal = ''

    // custom 123 keyboard only
    if (value === '❮') {
      if (!oldVal && getPrevField) {
        getPrevField()
      }

      newVal = oldVal.slice(0, oldVal.length - 1)
    } else if (maxLength && oldVal.length === maxLength) {
      return
    } else {
      newVal = oldVal + value
    }

    if (this.props.hasDecimal) {
      if (newVal.includes('.') !== oldVal.includes('.')) {
        newVal.includes('.')
          ? this.animateUtilityKeyOut()
          : this.animateUtilityKeyIn('decimal')
      }
    }

    // if (this.props.isCurrency) {
    //   newVal = currency.formatInput(newVal)
    // }

    this.props.handleChange(newVal)
  }

  private handleNumber = (value: string) => {
    this.animateScaleOut(value)
    this.handleChange(value)
  }

  private handleDelete = () => {
    this.animateScaleIn('❮')
    this.handleChange('❮')

    // only allow longpress deleting on IOS as TapGestureHandler's
    // onHandlerStateChange events terminated early on android
    if (Platform.OS === 'ios') {
      this.longPressTimer = setTimeout(() => this.startLongDelete(), 250)
    }
  }

  private startLongDelete = () => {
    this.deleteTimer = setInterval(() => this.handleChange('❮'), 75)
  }

  private stopLongDelete = () => {
    clearTimeout(this.deleteTimer)
    clearTimeout(this.longPressTimer)
    this.animateScaleOut('❮')
  }

  private numberEl = (value: string) => {
    const fontSize = valueAtSize({ sm: 18, md: 22, lg: 28 })
    const fontScale = this.touchScaleValues[value].interpolate({
      inputRange: [0, 1],
      outputRange: [fontSize, fontSize * 3],
    })

    return (
      <TouchableWithoutFeedback
        disabled={this.props.disabled}
        onPress={() => this.handleNumber(value)}
        onPressIn={() => this.animateScaleIn(value)}
        onPressOut={() => this.animateScaleOut(value)}
      >
        <ValueContainer>
          <Value style={{ fontSize: fontScale }}>{value}</Value>
        </ValueContainer>
      </TouchableWithoutFeedback>
    )
  }

  private decimalEl = () => {
    const fontSize = valueAtSize({ sm: 22, md: 26, lg: 32 })
    const fontScale = this.touchScaleValues['.'].interpolate({
      inputRange: [0, 1],
      outputRange: [fontSize, fontSize * 3],
    })

    return (
      <TouchableWithoutFeedback
        onPress={() => this.handleNumber('.')}
        onPressIn={() => this.animateScaleIn('.')}
        onPressOut={() => this.animateScaleOut('.')}
      >
        <ValueContainer>
          <Value
            style={{
              paddingBottom: valueAtSize({ sm: 5, md: 7, lg: 10 }),
              fontSize: fontScale,
              opacity: this.utilityKeyOpacity,
            }}
          >
            ·
          </Value>
        </ValueContainer>
      </TouchableWithoutFeedback>
    )
  }

  private deleteEl = () => {
    const value = '❮'
    const fontSize = valueAtSize({ sm: 14, md: 18, lg: 20 })
    const fontScale = this.touchScaleValues[value].interpolate({
      inputRange: [0, 1],
      outputRange: [fontSize, fontSize * 3],
    })

    return (
      <TapGestureHandler
        enabled={!this.props.disabled}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === GestureState.BEGAN) {
            this.handleDelete()
          } else if (
            nativeEvent.state === GestureState.END ||
            nativeEvent.state === GestureState.FAILED ||
            nativeEvent.state === GestureState.CANCELLED
          ) {
            this.stopLongDelete()
          }
        }}
      >
        <ValueContainer>
          <Value style={{ fontSize: fontScale }}>{value}</Value>
        </ValueContainer>
      </TapGestureHandler>
    )
  }

  private alphaEl = () => {
    const { disabled, getPrevField, handleChange, value } = this.props
    const fontSize = valueAtSize({ sm: 12, md: 16, lg: 18 })
    const fontScale = this.touchScaleValues.ABC.interpolate({
      inputRange: [0, 1],
      outputRange: [fontSize, fontSize * 2],
    })

    return (
      <ValueContainer>
        <HiddenTextInput
          autoCapitalize='characters'
          autoCorrect={false}
          editable={!disabled}
          onChangeText={(val: string) => {
            handleChange(val)
          }}
          onKeyPress={(e: { nativeEvent: { key: string } }) => {
            // native ABC keyboard only
            if (!value && getPrevField && e.nativeEvent.key === 'Backspace') {
              getPrevField()
            }
          }}
          onTouchStart={() => this.animateScaleIn('ABC')}
          onTouchEnd={() => this.animateScaleOut('ABC')}
          value={value}
        />
        <Value style={{ fontSize: fontScale, opacity: this.utilityKeyOpacity }}>
          ABC
        </Value>
      </ValueContainer>
    )
  }

  public render() {
    const { alpha, decimal } = this.state

    return (
      <El
        showing={this.state.isShowing}
        style={{ opacity: this.numPadOpacity }}
      >
        <NavigationEvents
          onDidFocus={_ => this.onFocus()}
          onWillBlur={_ => this.onBlur()}
        />
        <Row>
          {this.numberEl('1')}
          {this.numberEl('2')}
          {this.numberEl('3')}
        </Row>
        <Row>
          {this.numberEl('4')}
          {this.numberEl('5')}
          {this.numberEl('6')}
        </Row>
        <Row>
          {this.numberEl('7')}
          {this.numberEl('8')}
          {this.numberEl('9')}
        </Row>
        <Row>
          {decimal && this.decimalEl()}
          {alpha && this.alphaEl()}
          {!decimal && !alpha && <ValueContainer />}
          {this.numberEl('0')}
          {this.deleteEl()}
        </Row>
      </El>
    )
  }
}
