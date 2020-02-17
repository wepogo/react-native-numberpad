import { Dimensions } from 'react-native'
import DeviceInfo from 'react-native-device-info'

const { height, width } = Dimensions.get('window')

// Breakpoints
const lgHeight = 812
const medHeight = 667

export const valueAtSize = (values: { sm: any; md?: any; lg?: any }): any => {
  if (height >= lgHeight) {
    return values.lg || values.md || values.sm
  } else if (height >= medHeight) {
    return values.md || values.sm
  } else {
    return values.sm
  }
}
