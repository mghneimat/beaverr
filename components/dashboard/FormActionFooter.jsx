import { View } from 'react-native';

/** Centers link-style actions at the bottom of registration edit cards. */
export default function FormActionFooter({ children }) {
  return (
    <View style={{ alignItems: 'center', width: '100%', paddingTop: 4 }}>
      {children}
    </View>
  );
}
